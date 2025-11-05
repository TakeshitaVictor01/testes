// static/script/empresa_masks.js

document.addEventListener('DOMContentLoaded', function () {
    // Atraso leve para garantir que o IMask (da CDN) foi carregado
    setTimeout(() => {
        if (window.IMask) {
            
            // --- MÁSCARA PARA O CNPJ ---
            const cnpjInput = document.getElementById('item-cnpj');
            if (cnpjInput) {
                IMask(cnpjInput, { mask: '00.000.000/0000-00' });
            }

            // --- MÁSCARA PARA O TELEFONE (CELULAR E FIXO) ---
            const phoneInput = document.getElementById('item-phoneNumber');
            if (phoneInput) {
                IMask(phoneInput, {
                    mask: [
                        {
                            mask: '(00) 0000-0000',
                            maxLength: 10
                        },
                        {
                            mask: '(00) 00000-0000'
                        }
                    ]
                });
            }
        } else {
            console.error("Biblioteca IMask não foi carregada a tempo.");
        }
    }, 100); // 100ms de atraso
});