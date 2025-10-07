from openai import OpenAI
import inspect, json
from typing import get_args, get_origin, Literal

SYSTEM = "system"
ASSISTANT = "assistant"
USER = "user"
TOOL = "tool"

class Agent:
    def __init__(self, model: str, system_prompt: str, tools: list = [], temperature: float = 0.3, **openai_kwargs):
        self.model = model
        self.temperature = temperature
        self.tool_mapping = {}
        self.tools_schema = []
        self.system_prompt_funcs = {}
        self.llm_system_prompt = system_prompt

        self.client = OpenAI(**openai_kwargs)
        self.conversation_history = [{"role": SYSTEM, "content": self.llm_system_prompt}]

        for tool in tools:
            self.__store_tool_info(tool)

    def __store_tool_info(self, f):
        has_context, tool_schema = self.__extract_tool_schema(f)
        self.tool_mapping[f.__name__] = {
            "func": f,
            "hasContext": has_context,
        }
        self.tools_schema.append(tool_schema)

    def __extract_tool_schema(self, f):
        type_map = {
            "str": "string",
            "int": "integer",
            "float": "number",
            "bool": "boolean",
        }
        
        signature = inspect.signature(f)
        parameters = {}
        required = []

        for name, param in signature.parameters.items():
            if name == "ctx":
                continue # Skip context parameter in schema
            
            annotation = param.annotation
            param_schema = {}

            # Handle Literal for enums
            if get_origin(annotation) is Literal:
                param_schema["type"] = "string"
                param_schema["enum"] = list(get_args(annotation))
            elif annotation is not inspect.Parameter.empty:
                param_type_name = getattr(annotation, '__name__', str(annotation)).lower()
                param_schema["type"] = type_map.get(param_type_name, "string")
            else:
                param_schema["type"] = "string" # Default to string if no type hint

            if param.default is inspect.Parameter.empty:
                required.append(name)
            
            parameters[name] = param_schema

        has_context = "ctx" in signature.parameters

        tool_schema = {
            "type": "function",
            "function": {
                "name": f.__name__,
                "description": inspect.getdoc(f),
                "parameters": {
                    "type": "object",
                    "properties": parameters,
                    "required": required,
                },
            },
        }
        return has_context, tool_schema

    def tool(self):
        def wrapper(f):
            self.__store_tool_info(f)
            return f
        return wrapper

    def system_prompt(self):
        def wrapper(f):
            has_context, _ = self.__extract_tool_schema(f)
            self.system_prompt_funcs[f.__name__] = {
                "func": f,
                "hasContext": has_context,
            }
            return f
        return wrapper

    def __clear_history(self) -> None:
        self.conversation_history = [{"role": SYSTEM, "content": self.llm_system_prompt}]

    def run_stream(self, prompt: str, dependency=None, clear_history_after_execution: bool = True):
        if clear_history_after_execution:
            self.__clear_history()

        system_prompt = self.__format_system_prompt(dependency, self.llm_system_prompt, final_response=False)
        self.conversation_history[0]["content"] = system_prompt
        self.__append_message(USER, prompt)
        
        # --- Native ReAct Loop ---
        logical_steps = 0
        while logical_steps < 30:
            logical_steps += 1
            stream = self.generate_response(
                conversation=self.conversation_history,
                tools=self.tools_schema if self.tools_schema else None,
                tool_choice="auto" if self.tools_schema else None
            )

            response_message = ""
            tool_calls_aggregator = []

            # yield response
            for chunk in stream:
                content_delta = chunk.choices[0].delta.content
                if content_delta:
                    response_message += content_delta
                    yield content_delta

                tool_call_chunks = chunk.choices[0].delta.tool_calls
                if tool_call_chunks:
                    tool_calls_aggregator.extend(tool_call_chunks)

            self.__append_message(ASSISTANT, response_message, tool_calls_aggregator)

            if not tool_calls_aggregator:
                break # Final answer received

            # --- Simplified Tool Execution ---
            for tool_call in tool_calls_aggregator:
                tool_call = tool_call.model_dump()

                tool_name = tool_call["function"]["name"]
                tool_args = tool_call["function"]["arguments"]
                tool_id = tool_call["id"]

                output = self.__execute_func(tool_name, tool_args, dependency)

                self.conversation_history.append({
                    "role": TOOL,
                    "tool_call_id": tool_id,
                    "name": tool_name,
                    "content": str(output),
                })
        # Debug        
        # with open("convo.json", "w+") as file:
        #     json.dump(self.conversation_history, file, indent=4)


    def __format_system_prompt(self, dependency, base_prompt: str, final_response: bool = False):
        for f in self.system_prompt_funcs.values():
            func = f["func"]
            has_context = f["hasContext"]
            output = func(ctx=dependency) if has_context else func()
            base_prompt += "\n" + output
        return base_prompt

    def __execute_func(self, tool_name: str, tool_parameters_str: str, dependency=None):
        func_data = self.tool_mapping.get(tool_name)
        if not func_data:
            return f"Error: Tool '{tool_name}' not found."

        func = func_data["func"]
        has_context = func_data["hasContext"]
        try:
            params = json.loads(tool_parameters_str)
            result = func(**params, ctx=dependency) if has_context else func(**params)
            return result
        except json.JSONDecodeError:
            return "Error: Invalid JSON arguments provided."
        except Exception as e:
            return f"Error executing tool '{tool_name}': {e}"

    def generate_response(self, conversation: list, **kwargs):
        completion = self.client.chat.completions.create(
            model=self.model,
            messages=conversation,
            temperature=self.temperature,
            stream=True,
            stream_options={"include_usage": True},
            **kwargs,
        )
        return completion

    def __append_message(self, role: str, content: str | None, tool_calls=None) -> None:
        message = {"role": role, "content": content}
        if tool_calls:
            message["tool_calls"] = [tool_call.model_dump() for tool_call in tool_calls]
            message["content"] = None

        self.conversation_history.append(message)

    def export_convo(self, include_system_prompt: bool = False) -> list[dict]:
        if include_system_prompt:
            return self.conversation_history
        return self.conversation_history[1:] # everything except the system prompt
    
    def load_convo(self, convo: list) -> bool:
        self.__clear_history()
        self.conversation_history.extend(convo)
