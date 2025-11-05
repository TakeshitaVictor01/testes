export class ApiService {

    constructor(baseUrl) {
        if (!baseUrl) {
            throw new Error("A URL base da API é obrigatória.");
        }
        this.baseUrl = baseUrl;
    }

    async getByGenericParameter(endpoint, itemData) {
        const response = await fetch(`${this.baseUrl}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });
        const data = await response.json();
        if (data.status !== 'success')
            throw new Error(`Não foi possível carregar os dados para edição. ${data.message || ''}`);
        return data;
    }

    async getAll() {
        const response = await fetch(`${this.baseUrl}/getAll`);
        const data = await response.json();
        if (data.status !== 'success')
            throw new Error(`Erro ao buscar dados. Status: ${data.message || ''}`);
        return data;
    }

    async getById(itemData) {
        const response = await fetch(`${this.baseUrl}/getById`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });
        const data = await response.json();
        if (data.status !== 'success')
            throw new Error(`Não foi possível carregar os dados para edição. ${data.message || ''}`);
        return data;
    }

    async generic(endpoint, itemData) {
        const response = await fetch(`${this.baseUrl}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
        });
        const data = await response.json();
        if (data.status !== 'success')
            throw new Error(`Não foi possível carregar os dados para edição. ${data.message || ''}`);
        return data;
    }

    async create(itemData) {
        const response = await fetch(`${this.baseUrl}/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData),
        });
        const data = await response.json();
        if (data.status !== "success") {
            throw new Error(`Falha ao criar o item: ${data.message || 'Erro desconhecido'}`);
        }
        return data;
    }

    async update(itemData) {
        const response = await fetch(`${this.baseUrl}/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData),
        });
        const data = await response.json();
        if (data.status !== "success") {
            throw new Error(`Falha ao atualizar o item: ${data.message || 'Erro desconhecido'}`);
        }
        return data;
    }

    async delete(itemData) {
        const response = await fetch(`${this.baseUrl}/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData),
        });
        const data = await response.json();
        if (data.status !== 'success') {
            throw new Error(`Falha ao excluir o item: ${data.message || 'Erro desconhecido'}`);
        }
        return data;
    }
}