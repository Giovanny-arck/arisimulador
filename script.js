// Taxas do simulador
const taxaPrazo = {
    18: { mensal: 0.015, final: 0.015 },
    24: { mensal: 0.016, final: 0.016 },
    36: { mensal: 0.018, final: 0.018 }
};
const taxaExtra = [
    { min: 20000, max: 99999.99, extra: 0.000 },
    { min: 100000, max: 199999.99, extra: 0.003 },
    { min: 200000, max: 399999.99, extra: 0.005 },
    { min: 400000, max: Infinity, extra: 0.007 }
];
const taxaAdicionalFinal = 0.005;

// Variáveis de estado
let formaSelecionada = 'final';
let prazoSelecionado = null;
let valorInvestido = 0;

// --- LÓGICA DE FORMATAÇÃO E MÁSCARAS ---
function desformatarMoeda(valorString) {
    if (!valorString) return 0;
    const apenasNumeros = valorString.replace(/\D/g, '');
    return parseFloat(apenasNumeros) / 100 || 0;
}

function formatarMoeda(valorNumerico, ignorarMinimo = false) {
    if (isNaN(valorNumerico) || valorNumerico <= 0) return '-';
    if (ignorarMinimo || valorNumerico >= 20000) {
        return valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    return '-';
}

// Máscara de Telefone (00) 00000-0000
function aplicarMascaraTelefone(valor) {
    valor = valor.replace(/\D/g, ""); 
    valor = valor.substring(0, 11); // Limita a 11 dígitos numéricos (DDD + 9 dígitos)
    
    if (valor.length > 10) {
        valor = valor.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (valor.length > 5) {
        valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (valor.length > 2) {
        valor = valor.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
    } else if (valor.length > 0) {
        valor = valor.replace(/^(\d*)/, "($1");
    }
    return valor;
}

// --- RESET DA TABELA ---
function resetarTabelaParaPlaceholders() {
    const tbody = document.getElementById('resBody');
    const thead = document.getElementById('resultado-head');
    
    if (formaSelecionada === 'final') {
        thead.innerHTML = `<tr><th>Prazo</th><th>Retorno Total</th><th>Taxa Efetiva a.m.</th></tr>`;
        tbody.innerHTML = `<tr><td>18 meses</td><td>-</td><td>-</td></tr><tr><td>24 meses</td><td>-</td><td>-</td></tr><tr><td>36 meses</td><td>-</td><td>-</td></tr>`;
    } else { 
        thead.innerHTML = `<tr><th>Prazo</th><th>Mensal</th><th>Retorno Fim</th><th>Total</th><th>Taxa</th></tr>`;
        tbody.innerHTML = `<tr><td>18 meses</td><td>-</td><td>-</td><td>-</td><td>-</td></tr><tr><td>24 meses</td><td>-</td><td>-</td><td>-</td><td>-</td></tr><tr><td>36 meses</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>`;
    }
    document.getElementById('dados-cliente-section').style.display = 'none';
    document.getElementById('terms-section').style.display = 'none';
    document.getElementById('btn-enviar').style.display = 'none';
    document.querySelectorAll('.prazo-btn').forEach(btn => btn.classList.remove('selected'));
    prazoSelecionado = null;
}

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', function() {
    const inputsParaValidar = ['cliente', 'email', 'profissao', 'contato', 'terms-checkbox'];
    inputsParaValidar.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', validarDadosCliente);
            el.addEventListener('change', validarDadosCliente);
        }
    });

    const valorInput = document.getElementById('valor');
    valorInput.addEventListener('input', () => {
        const valorNumerico = desformatarMoeda(valorInput.value);
        valorInvestido = !isNaN(valorNumerico) && valorNumerico > 0 ? valorNumerico : 0;
        valorInput.value = valorInvestido > 0 ? formatarMoeda(valorInvestido, true) : '';
        valorInvestido >= 20000 ? calcular() : resetarTabelaParaPlaceholders();
    });

    // Aplica máscara e limite de caracteres no contato
    const contatoInput = document.getElementById('contato');
    contatoInput.setAttribute('maxlength', '20'); // Limite de 20 caracteres pedido
    contatoInput.addEventListener('input', (e) => {
        e.target.value = aplicarMascaraTelefone(e.target.value);
    });
});

function selecionarForma(forma) {
    formaSelecionada = forma;
    document.querySelectorAll('.recebimento-btn').forEach(btn => btn.classList.remove('selected'));
    document.getElementById(`btn-${forma}`).classList.add('selected');
    document.getElementById('texto-explicativo-mensal').style.display = (forma === 'mensal') ? 'block' : 'none';
    document.getElementById('texto-explicativo-final').style.display = (forma === 'final') ? 'block' : 'none';
    valorInvestido >= 20000 ? calcular() : resetarTabelaParaPlaceholders();
}

function calcular() {
    if (valorInvestido < 20000) return;
    let tbody = document.getElementById('resBody');
    let thead = document.getElementById('resultado-head');
    tbody.innerHTML = "";
    
    if (formaSelecionada === 'mensal') {
        thead.innerHTML = `<tr><th>Prazo</th><th>Mensal</th><th>Retorno Fim</th><th>Total</th><th>Taxa</th></tr>`;
        [18, 24, 36].forEach(p => {
            const taxa = taxaPrazo[p].mensal + (valorInvestido >= 100000 ? obterTaxaExtraPorValor(valorInvestido) : 0);
            const mensal = valorInvestido * taxa;
            tbody.innerHTML += `<tr><td>${p}m</td><td>${formatarMoeda(mensal, true)}</td><td>${formatarMoeda(valorInvestido)}</td><td>${formatarMoeda(valorInvestido + (mensal * p), true)}</td><td>${(taxa*100).toFixed(2)}%</td></tr>`;
        });
    } else {
        thead.innerHTML = `<tr><th>Prazo</th><th>Retorno Total</th><th>Taxa Efetiva a.m.</th></tr>`;
        [18, 24, 36].forEach(p => {
            const taxa = taxaPrazo[p].final + taxaAdicionalFinal + obterTaxaExtraPorValor(valorInvestido);
            tbody.innerHTML += `<tr><td>${p} meses</td><td>${formatarMoeda(valorInvestido + (valorInvestido * taxa * p), true)}</td><td>${(taxa*100).toFixed(2)}%</td></tr>`;
        });
    }
}

function obterTaxaExtraPorValor(v) {
    for (let f of taxaExtra) { if (v >= f.min && v <= f.max) return f.extra; }
    return 0.007;
}

function selecionarPrazo(p) {
    prazoSelecionado = p;
    document.querySelectorAll('.prazo-btn').forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
    document.getElementById('dados-cliente-section').style.display = 'block';
    document.getElementById('terms-section').style.display = 'block';
    document.getElementById('btn-enviar').style.display = 'block';
    if(window.innerWidth < 768) document.getElementById('dados-cliente-section').scrollIntoView({behavior: "smooth"});
}

function validarDadosCliente() {
    const n = document.getElementById('cliente').value.trim().length > 3;
    const e = document.getElementById('email').value.includes('@');
    const p = document.getElementById('profissao').value.trim() !== '';
    const c = document.getElementById('contato').value.replace(/\D/g, '').length >= 10;
    const t = document.getElementById('terms-checkbox').checked;
    
    const valido = n && e && p && c && t;
    document.getElementById('btn-enviar').disabled = !valido;
    return valido;
}

async function enviarProposta() {
    if (!validarDadosCliente()) return;
    const btn = document.getElementById('btn-enviar');
    btn.disabled = true;
    btn.innerText = "Enviando...";

    try {
        const dados = {
            cliente: document.getElementById('cliente').value,
            email: document.getElementById('email').value,
            profissao: document.getElementById('profissao').value,
            contato: document.getElementById('contato').value,
            valor: valorInvestido,
            forma: formaSelecionada,
            prazo: prazoSelecionado
        };
        
        const response = await fetch('https://n8nwebhook.arck1pro.shop/webhook/simulador', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            alert('Proposta enviada com sucesso!');
            location.reload();
        } else {
            throw new Error();
        }
    } catch (err) {
        alert('Erro ao enviar proposta. Tente novamente mais tarde.');
        btn.disabled = false;
        btn.innerText = "Enviar Proposta";
    }
}