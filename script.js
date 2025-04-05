const carouselModule = (() => {
    const carousels = {};

    const init = (carouselId) => {
        const carouselContainer = document.getElementById(carouselId);
        if (!carouselContainer) {
            console.error(`Carousel with ID "${carouselId}" not found.`);
            return false;
        }

        const slides = carouselContainer.querySelectorAll(".carousel-slide");
        const nextButton = carouselContainer.querySelector(".carousel-button.next");
        const prevButton = carouselContainer.querySelector(".carousel-button.prev");
        const track = carouselContainer.querySelector(".carousel-track");

        if (!slides.length || !nextButton || !prevButton || !track) {
            console.error(`Carousel elements "${carouselId}" not found.`);
            return false;
        }

        carousels[carouselId] = {
            currentSlide: 0,
            slides: slides,
            nextButton: nextButton,
            prevButton: prevButton,
            track: track,
            intervalId: null,
            autoSlideActive: true,
            startX: 0,
            endX: 0
        };

        nextButton.addEventListener("click", () => {
            stopAutoSlide(carouselId);
            showNextSlide(carouselId);
            restartAutoSlide(carouselId);
        });
        prevButton.addEventListener("click", () => {
            stopAutoSlide(carouselId);
            showPrevSlide(carouselId);
            restartAutoSlide(carouselId);
        });

        carouselContainer.addEventListener("mouseenter", () => stopAutoSlide(carouselId));
        carouselContainer.addEventListener("mouseleave", () => {
            if (carousels[carouselId].autoSlideActive) {
                startAutoSlide(carouselId);
            }
        });

        // Adiciona suporte a gestos de deslizar (swipe)
        carouselContainer.addEventListener("touchstart", (e) => handleTouchStart(e, carouselId));
        carouselContainer.addEventListener("touchmove", (e) => handleTouchMove(e, carouselId));
        carouselContainer.addEventListener("touchend", () => handleTouchEnd(carouselId));

        showSlide(carouselId, 0);
        startAutoSlide(carouselId);

        return true;
    };

    const showSlide = (carouselId, index) => {
        const carousel = carousels[carouselId];
        carousel.track.style.transform = `translateX(-${index * 100}%)`;
    };

    const showNextSlide = (carouselId) => {
        const carousel = carousels[carouselId];
        carousel.currentSlide = (carousel.currentSlide + 1) % carousel.slides.length;
        showSlide(carouselId, carousel.currentSlide);
    };

    const showPrevSlide = (carouselId) => {
        const carousel = carousels[carouselId];
        carousel.currentSlide = (carousel.currentSlide - 1 + carousel.slides.length) % carousel.slides.length;
        showSlide(carouselId, carousel.currentSlide);
    };

    const startAutoSlide = (carouselId) => {
        const carousel = carousels[carouselId];
        if (carousel.autoSlideActive) {
            carousel.intervalId = setInterval(() => showNextSlide(carouselId), 5000);
        }
    };

    const stopAutoSlide = (carouselId) => {
        const carousel = carousels[carouselId];
        clearInterval(carousel.intervalId);
    };

    const restartAutoSlide = (carouselId) => {
        stopAutoSlide(carouselId);
        startAutoSlide(carouselId);
    };

    // Funções para suporte a gestos de deslizar (swipe)
    const handleTouchStart = (e, carouselId) => {
        const carousel = carousels[carouselId];
        carousel.startX = e.touches[0].clientX;
    };

    const handleTouchMove = (e, carouselId) => {
        const carousel = carousels[carouselId];
        carousel.endX = e.touches[0].clientX;
    };

    const handleTouchEnd = (carouselId) => {
        const carousel = carousels[carouselId];
        const deltaX = carousel.startX - carousel.endX;

        if (Math.abs(deltaX) > 50) { // Define um limite para considerar como swipe
            stopAutoSlide(carouselId);
            if (deltaX > 0) {
                showNextSlide(carouselId); // Swipe para a esquerda
            } else {
                showPrevSlide(carouselId); // Swipe para a direita
            }
            restartAutoSlide(carouselId);
        }
    };

    return { init };
})();

const themeModule = (() => {
    let toggleButton;

    const init = () => {
        toggleButton = document.getElementById("toggleTheme");
        if (!toggleButton) {
            console.error("Theme button not found");
            return false;
        }
        toggleButton.addEventListener("click", toggleTheme);
        initializeTheme();
        return true;
    };

    const toggleTheme = () => {
        document.body.classList.toggle("dark-mode");
        const theme = document.body.classList.contains("dark-mode") ? "dark" : "light";
        localStorage.setItem("theme", theme);
        updateThemeButton();
    };

    const initializeTheme = () => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") {
            document.body.classList.add("dark-mode");
        }
        updateThemeButton();
    };

    const updateThemeButton = () => {
        if (toggleButton) {
            toggleButton.innerHTML = document.body.classList.contains("dark-mode")
                ? '<i class="fas fa-sun"></i> Light Mode'
                : '<i class="fas fa-moon"></i> Dark Mode';
        }
    };

    return { init, initializeTheme, toggleTheme, updateThemeButton };
})();

const cartModule = (() => {
    let cart = [];
    let total = 0;
    let cartList, totalElement, cartCount, cartItemsList, cartTotalDisplay, cartMenu;
    let isPrincipalCheckout = false;

    const init = () => {
        cartList = document.querySelector(".cart-list");
        totalElement = document.getElementById("total");
        cartCount = document.getElementById("cart-count");
        cartItemsList = document.getElementById("cart-items");
        cartTotalDisplay = document.getElementById("cart-total");
        cartMenu = document.getElementById("cart-menu");

        if (!cartList || !totalElement || !cartCount || !cartItemsList || !cartTotalDisplay) {
            console.error("Cart elements not found.");
            return false;
        }

        cartList.addEventListener("click", handleRemoveItem);
        cartItemsList.addEventListener("click", handleRemoveItem);

        const cartIcon = document.querySelector(".cart-icon");
        if (cartIcon) {
            cartIcon.addEventListener("click", toggleCartMenu);
        }

        const closeCartButton = document.querySelector(".close-cart-button");
        if (closeCartButton) {
            closeCartButton.addEventListener("click", toggleCartMenu);
        }

        // Event listener para os botões "Adicionar" das promoções, bebidas e sabores.
        document.body.addEventListener('click', function(event) {
            if (event.target.classList.contains('add-to-cart')) {
                const name = event.target.dataset.name;
                const price = parseFloat(event.target.dataset.price);
                if (name && !isNaN(price)) {
                    addItem(name, price);
                }
            }
        });

        return true;
    };

    const updateCartDisplay = () => {
        cartList.innerHTML = "";
        cartItemsList.innerHTML = "";

        let totalValue = 0;

        cart.forEach((item, index) => {
            const listItem = document.createElement("li");
            listItem.innerHTML = `
                <span>${item.name} - R$ ${item.price.toFixed(2)}</span>
                <button class="remove-item" data-index="${index}"><i class="fas fa-trash"></i></button>
            `;
            cartList.appendChild(listItem);
            cartItemsList.appendChild(listItem.cloneNode(true));
            totalValue += item.price;
        });

        total = totalValue;
        totalElement.textContent = `R$ ${total.toFixed(2)}`;
        cartCount.textContent = cart.length;
        cartTotalDisplay.textContent = `R$ ${total.toFixed(2)}`;
    };

    const addItem = (name, price) => {
        cart.push({ name, price });
        updateCartDisplay();
        alert(`${name} foi adicionado ao carrinho!`);
    };

    const removeItem = (index) => {
        if (index >= 0 && index < cart.length) {
            total -= cart[index].price;
            cart.splice(index, 1);
            updateCartDisplay();
        }
    };

    const handleRemoveItem = (event) => {
        if (event.target.closest(".remove-item")) {
            const index = parseInt(event.target.closest(".remove-item").getAttribute("data-index"), 10);
            removeItem(index);
        }
    };

    const toggleCartMenu = () => {
        cartMenu.classList.toggle("active");
    };

    const checkout = (principal) => {
        isPrincipalCheckout = principal;
        if (cart.length === 0) {
            alert("Empty cart! Add items to cart.");
            return;
        }

        let deliveryOption, addressData;

        if (isPrincipalCheckout) {
            deliveryOption = document.querySelector('input[name="delivery-principal"]:checked').value;
            if (deliveryOption === 'entrega') {
                addressData = {
                    cep: document.getElementById('cep-principal').value,
                    rua: document.getElementById('rua-principal').value,
                    numero: document.getElementById('numero-principal').value,
                    complemento: document.getElementById('complemento-principal').value,
                    bairro: document.getElementById('bairro-principal').value,
                    cidade: document.getElementById('cidade-principal').value,
                    estado: document.getElementById('estado-principal').value,
                };
            }
        } else {
            deliveryOption = document.querySelector('input[name="delivery"]:checked').value;
            if (deliveryOption === 'entrega') {
                addressData = {
                    cep: document.getElementById('cep').value,
                    rua: document.getElementById('rua').value,
                    numero: document.getElementById('numero').value,
                    complemento: document.getElementById('complemento').value,
                    bairro: document.getElementById('bairro').value,
                    cidade: document.getElementById('cidade').value,
                    estado: document.getElementById('estado').value,
                };
            }
        }
        if (deliveryOption === 'entrega' && !addressData.numero) {
            alert("Please enter the house number.");
            return;
        }

        let message = "New order:\n\n";
        cart.forEach(item => {
            message += `${item.name} - R$ ${item.price.toFixed(2)}\n`;
        });
        message += `\nTotal: R$ ${total.toFixed(2)}\n`;

        if (deliveryOption === 'entrega') {
            message += `\nAddress:\nCEP: ${addressData.cep}\nRua: ${addressData.rua}, ${addressData.numero} ${addressData.complemento}\nBairro: ${addressData.bairro}\nCidade: ${addressData.cidade}, ${addressData.estado}\n`;
        } else {
            message += "\nPick up on site.\n";
        }

        const phoneNumber = "5517996780618";
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    };

    return { init, addItem, removeItem, checkout, updateCartDisplay, cart }; // Adicionado cart
})();

const loyaltyModule = (() => {
    let clienteCadastrado = null;

    const init = () => {
        // Carregar dados do cliente do localStorage
        clienteCadastrado = JSON.parse(localStorage.getItem("cliente"));

        const cadastrarButton = document.getElementById("cadastrar-fidelidade");
        const resgatarButton = document.getElementById("resgatar-pontos");
        const cadastroDiv = document.getElementById("cadastro-fidelidade");
        const carteiraDiv = document.getElementById("carteira-digital");
        const nomeClienteSpan = document.getElementById("nome-cliente");
        const pontosClienteSpan = document.getElementById("pontos-cliente");
        const telefoneInput = document.getElementById("telefone-fidelidade");
        const linkWhatsappFidelidade = document.getElementById("link-whatsapp-fidelidade");

        if (!cadastrarButton || !resgatarButton || !cadastroDiv || !carteiraDiv || !nomeClienteSpan || !pontosClienteSpan || !telefoneInput || !linkWhatsappFidelidade) {
            console.error("Elementos de fidelidade não encontrados.");
            return false;
        }

        cadastrarButton.addEventListener("click", cadastrarCliente);
        resgatarButton.addEventListener("click", resgatarPontos);

        // Inicializar interface com dados do cliente (se existirem)
        if (clienteCadastrado) {
            exibirCarteiraDigital();
        }

        return true;
    };

    const cadastrarCliente = () => {
        const nome = document.getElementById("nome-fidelidade").value;
        const telefone = document.getElementById("telefone-fidelidade").value;

        if (nome && telefone) {
            clienteCadastrado = { nome: nome, telefone: telefone, pontos: 0, historicoPedidos: [] };
            localStorage.setItem("cliente", JSON.stringify(clienteCadastrado));
            exibirCarteiraDigital();
        } else {
            alert("Por favor, preencha todos os campos.");
        }
    };

    const exibirCarteiraDigital = () => {
        const cadastroDiv = document.getElementById("cadastro-fidelidade");
        const carteiraDiv = document.getElementById("carteira-digital");
        const nomeClienteSpan = document.getElementById("nome-cliente");
        const pontosClienteSpan = document.getElementById("pontos-cliente");
        const telefoneInput = document.getElementById("telefone-fidelidade");
        const linkWhatsappFidelidade = document.getElementById("link-whatsapp-fidelidade");

        cadastroDiv.style.display = "none";
        carteiraDiv.style.display = "block";
        nomeClienteSpan.innerText = clienteCadastrado.nome;
        pontosClienteSpan.innerText = clienteCadastrado.pontos;

        // Atualizar link do WhatsApp
        linkWhatsappFidelidade.href = `https://wa.me/${clienteCadastrado.telefone}?text=Olá,%20gostaria%20de%20ver%20meus%20pontos.`;

        // Exibir sugestões ao cadastrar ou carregar cliente
        suggestionModule.exibirSugestoesPersonalizadas();
    };

    const adicionarPontos = (valorCompra) => {
        if (clienteCadastrado) {
            const pontos = Math.floor(valorCompra / 2); // Exemplo: 1 ponto a cada R$2
            clienteCadastrado.pontos += pontos;
            localStorage.setItem("cliente", JSON.stringify(clienteCadastrado));
            atualizarPontosNaCarteira();
            alert(`Parabéns, ${clienteCadastrado.nome}! Você ganhou ${pontos} pontos.`);
        }
    };

    const resgatarPontos = () => {
        if (clienteCadastrado && clienteCadastrado.pontos >= 10) { // Exemplo: Mínimo 10 pontos para resgate
            clienteCadastrado.pontos -= 10;
            localStorage.setItem("cliente", JSON.stringify(clienteCadastrado));
            atualizarPontosNaCarteira();
            alert("Resgate realizado! Você ganhou um desconto."); // Adapte com a lógica de desconto real
        } else {
            alert("Você não tem pontos suficientes para resgatar.");
        }
    };

    const atualizarPontosNaCarteira = () => {
        const pontosClienteSpan = document.getElementById("pontos-cliente");
        pontosClienteSpan.innerText = clienteCadastrado.pontos;
    };

    const getCliente = () => clienteCadastrado; // Adicione esta linha

    return { init, adicionarPontos, getCliente, resgatarPontos }; // Incluir getCliente aqui
})();

const suggestionModule = (() => {
    let produtos = [
        { id: 1, nome: "Coxinha de Frango", preco: 3.50, tipo: "salgado" },
        { id: 2, nome: "Enroladinho de Salsicha", preco: 4.00, tipo: "salgado" },
        { id: 3, nome: "Coca-Cola Lata", preco: 5.00, tipo: "bebida" },
        { id: 4, nome: "Combo Coxinha de Frango", preco: 15.00, tipo: "combo" },
    ];

    const exibirSugestoesPersonalizadas = () => {
        const sugestoesContainer = document.getElementById("sugestoes-produtos");
        sugestoesContainer.innerHTML = ""; // Limpar sugestões anteriores
        const cliente = loyaltyModule.getCliente(); // Use loyaltyModule.getCliente()

        if (cliente && cliente.historicoPedidos.length > 0) {
            // Lógica de sugestão baseada no histórico
            const ultimoPedido = cliente.historicoPedidos[cliente.historicoPedidos.length - 1];
            const produtosSugeridos = produtos.filter(p => p.tipo === ultimoPedido.tipo && p.id !== ultimoPedido.id);

            produtosSugeridos.forEach(produto => {
                const card = document.createElement("article");
                card.className = "promotion-item";
                card.innerHTML = `
                    <h3>${produto.nome}</h3>
                    <p>Que tal experimentar este?</p>
                    <button class="add-to-cart button" data-name="${produto.nome}" data-price="${produto.preco}">Adicionar ao Carrinho</button>
                `;
                sugestoesContainer.appendChild(card);
            });
        } else {
            // Sugestões padrão (se não houver histórico)
            const sugestaoPadrao = produtos[0]; // Primeiro produto como sugestão
            const card = document.createElement("article");
            card.className = "promotion-item";
            card.innerHTML = `
                <h3>${sugestaoPadrao.nome}</h3>
                <p>Experimente o nosso carro-chefe!</p>
                <button class="add-to-cart button" data-name="${sugestaoPadrao.nome}" data-price="${sugestaoPadrao.preco}">Adicionar ao Carrinho</button>
            `;
            sugestoesContainer.appendChild(card);
        }
    };

    return { exibirSugestoesPersonalizadas };
})();

document.addEventListener("DOMContentLoaded", () => {
    themeModule.init();
    cartModule.init();
    loyaltyModule.init(); // Inicialize o loyaltyModule

    // Inicializa os carrosséis
    carouselModule.init('tipos-salgado');
    carouselModule.init('sabores');

    const tiposCarrossel = document.getElementById('tipos-salgado');
    const saboresCarrossel = document.getElementById('sabores');
    const saboresTrack = document.getElementById('carousel-track-sabores');
    const tipoSelecionadoSpan = document.getElementById('tipo-selecionado');
    const saborSelecionadoSpan = document.getElementById('sabor-selecionado');
    const adicionarAoCarrinhoButton = document.getElementById('adicionar-ao-carrinho');
    const selecaoSection = document.getElementById('selecao'); // Adicionado

    let tipoSelecionado = null;
    let saborSelecionado = null;
    let saboresDisponiveis = []; // Agora armazena os dados dos sabores

    tiposCarrossel.addEventListener('click', function(event) {
        if (event.target.classList.contains('select-type')) {
            tipoSelecionado = event.target.dataset.tipo;
            tipoSelecionadoSpan.textContent = tipoSelecionado;
            atualizarSabores(tipoSelecionado);
            saborSelecionado = null;
            saborSelecionadoSpan.textContent = 'Nenhum';
            adicionarAoCarrinhoButton.disabled = true;
        }
    });

    // Evento de clique nos sabores (para ativar o botão "Adicionar") - CORRIGIDO
    saboresCarrossel.addEventListener('click', function(event) {
        // Garante que o clique ocorreu em um elemento product dentro do carrossel
        if (event.target.closest('.carousel-slide.product')) {
            // Encontra o elemento product clicado
            const saborElemento = event.target.closest('.carousel-slide.product');
            if (saborElemento) {
                saborSelecionado = saborElemento.dataset.sabor; // Define o sabor selecionado

                // Atualiza o texto na "Comanda"
                const saborNome = saboresDisponiveis.find(s => s.sabor === saborSelecionado)?.nome || 'Nenhum';
                saborSelecionadoSpan.textContent = saborNome;

                adicionarAoCarrinhoButton.disabled = false;
            }
        }
    });

    // Função para atualizar o carrossel de sabores
    function atualizarSabores(tipo) {
        saboresTrack.innerHTML = '';
        saboresDisponiveis = []; // Limpa os sabores disponíveis

        switch (tipo) {
            case 'coxinha':
                saboresDisponiveis = [
                    { nome: 'Frango', preco: 7.50, imagem: 'https://images.pexels.com/photos/12361995/pexels-photo-12361995.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', tipo: 'coxinha', sabor: 'frango' },
                    { nome: 'Costela', preco: 8.00, imagem: 'https://images.pexels.com/photos/8964567/pexels-photo-8964567.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', tipo: 'coxinha', sabor: 'costela' },
                    { nome: 'Calabresa com Cheddar', preco: 7.50, imagem: 'https://images.pexels.com/photos/17402718/pexels-photo-17402718/free-photo-of-comida-alimento-refeicao-pizza.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', tipo: 'coxinha', sabor: 'calabresa-com-cheddar' }
                ];
                break;
            case 'enroladinho':
                saboresDisponiveis = [
                    { nome: 'Salsicha', preco: 6.00, imagem: 'https://images.pexels.com/photos/357576/pexels-photo-357576.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', tipo: 'enroladinho', sabor: 'salsicha' },
                    { nome: 'Queijo e Presunto', preco: 6.50, imagem: 'https://images.pexels.com/photos/9615585/pexels-photo-9615585.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', tipo: 'enroladinho', sabor: 'queijo-e-presunto' }
                ];
                break;
            case 'bolinha':
                saboresDisponiveis = [
                    { nome: 'Carne com Queijo', preco: 6.00, imagem: 'https://cdn.pixabay.com/photo/2019/10/13/02/18/tomato-meat-sauce-4545230_1280.jpg', tipo: 'bolinha', sabor: 'carne-com-queijo' },
                    { nome: 'Calabresa', preco: 6.00, imagem: 'https://images.pexels.com/photos/6004718/pexels-photo-6004718.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', tipo: 'bolinha', sabor: 'calabresa' }
                ];
                break;
            case 'empada':
                saboresDisponiveis = [
                    { nome: 'Frango', preco: 6.00, imagem: 'https://images.pexels.com/photos/8679380/pexels-photo-8679380.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', tipo: 'empada', sabor: 'frango' },
                    { nome: 'Palmito', preco: 6.50, imagem: 'https://images.pexels.com/photos/8679380/pexels-photo-8679380.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', tipo: 'empada', sabor: 'palmito' },
                     { nome: 'Queijo', preco: 6.50, imagem: 'https://cdn.pixabay.com/photo/2017/01/11/19/56/cheese-1972744_1280.jpg', tipo: 'empada', sabor: 'queijo' }
                ];
                break;
            case 'tortinha':
                saboresDisponiveis = [
                    { nome: 'Legumes', preco: 4.50, imagem: 'https://images.pexels.com/photos/4577379/pexels-photo-4577379.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', tipo: 'tortinha', sabor: 'legumes' },
                    { nome: 'Frango', preco: 4.50, imagem: 'https://images.pexels.com/photos/4577379/pexels-photo-4577379.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2', tipo: 'tortinha', sabor: 'frango' }
                ];
                break;
            case 'torta':
                saboresDisponiveis = [
                    { nome: 'Frango com Catupiry', preco: 5.00, imagem: 'https://receitasdepesos.com.br/wp-content/uploads/2024/09/file-de-frango-com-catupiry.jpeg.webp', tipo: 'torta', sabor: 'frango-com-catupiry' },
                    { nome: 'Calabresa com Queijo', preco: 5.00, imagem: 'https://cdn.pixabay.com/photo/2021/10/16/12/50/fire-chicken-6714952_1280.jpg', tipo: 'torta', sabor: 'calabresa-com-queijo' }
                ];
                break;
            default:
                saboresTrack.innerHTML = '<p>Nenhum sabor disponível para este tipo de salgado.</p>';
                return;
        }

        saboresDisponiveis.forEach(function(sabor) {
            const slide = document.createElement('article');
            slide.classList.add('carousel-slide', 'product');
            slide.dataset.sabor = sabor.sabor; // Armazena o nome do sabor
            slide.dataset.preco = sabor.preco.toFixed(2);
            slide.innerHTML = `
                <img src="${sabor.imagem}" alt="Sabor ${sabor.nome}" loading="lazy" width="300" height="200">
                <h3>${sabor.nome}</h3>
                <button class="add-to-cart cta" data-name="${tipoSelecionado} de ${sabor.nome}" data-price="${sabor.preco.toFixed(2)}">Adicionar</button>
            `;
            saboresTrack.appendChild(slide);
        });

        // Inicialize o carrossel de sabores após adicionar os slides
        carouselModule.init('sabores');
    }

    // Adicionar ao Carrinho (após selecionar tipo e sabor) - REMOVIDO - Já está no body event listener

    const retirarRadioPrincipal = document.getElementById('retirar-principal');
    const entregaRadioPrincipal = document.getElementById('entrega-principal');
    const enderecoContainerPrincipal = document.getElementById('endereco-container-principal');
    const cepInputPrincipal = document.getElementById('cep-principal');
    const buscarEnderecoButtonPrincipal = document.getElementById('buscar-endereco-principal');
    const ruaInputPrincipal = document.getElementById('rua-principal');
    const numeroInputPrincipal = document.getElementById('numero-principal');
    const complementoInputPrincipal = document.getElementById('complemento-principal');
    const bairroInputPrincipal = document.getElementById('bairro-principal');
    const cidadeInputPrincipal = document.getElementById('cidade-principal');
    const estadoInputPrincipal = document.getElementById('estado-principal');

    const retirarRadio = document.getElementById('retirar');
    const entregaRadio = document.getElementById('entrega');
    const enderecoContainer = document.getElementById('endereco-container');
    const cepInput = document.getElementById('cep');
    const buscarEnderecoButton = document.getElementById('buscar-endereco');
    const ruaInput = document.getElementById('rua');
    const numeroInput = document.getElementById('numero');
    const complementoInput = document.getElementById('complemento');
    const bairroInput = document.getElementById('bairro');
    const cidadeInput = document.getElementById('cidade');
    const estadoInput = document.getElementById('estado');

    const buscarEndereco = (cep, ruaInput, bairroInput, cidadeInput, estadoInput, enderecoCompletoId) => {
        fetch(`https://viacep.com.br/ws/${cep}/json/`)
            .then(response => response.json())
            .then(data => {
                if (data.erro) {
                    alert('CEP não encontrado.');
                    return;
                }
                ruaInput.value = data.logradouro;
                bairroInput.value = data.bairro;
                cidadeInput.value = data.localidade;
                estadoInput.value = data.uf;
                document.getElementById(enderecoCompletoId).style.display = 'block';
            })
            .catch(error => {
                console.error('Erro ao buscar o CEP:', error);
                alert('Erro ao buscar o CEP. Tente novamente.');
            });
    };

    const updateEnderecoContainerVisibility = (radio, container) => {
        container.style.display = radio.checked ? 'block' : 'none';
    };

    updateEnderecoContainerVisibility(entregaRadioPrincipal, enderecoContainerPrincipal);
    updateEnderecoContainerVisibility(entregaRadio, enderecoContainer);

    entregaRadioPrincipal.addEventListener('change', function() {
        updateEnderecoContainerVisibility(entregaRadioPrincipal, enderecoContainerPrincipal);
    });

    retirarRadioPrincipal.addEventListener('change', function() {
        updateEnderecoContainerVisibility(entregaRadioPrincipal, enderecoContainerPrincipal);
    });

    buscarEnderecoButtonPrincipal.addEventListener('click', function() {
        const cep = cepInputPrincipal.value.replace(/\D/g, '');
        if (cep.length !== 8) {
            alert('CEP inválido. Digite um CEP com 8 dígitos.');
            return;
        }
        buscarEndereco(cep, ruaInputPrincipal, bairroInputPrincipal, cidadeInputPrincipal, estadoInputPrincipal, 'endereco-completo-principal');
    });

    entregaRadio.addEventListener('change', function() {
        updateEnderecoContainerVisibility(entregaRadio, enderecoContainer);
    });

    retirarRadio.addEventListener('change', function() {
        updateEnderecoContainerVisibility(entregaRadio, enderecoContainer);
    });

    buscarEnderecoButton.addEventListener('click', function() {
        const cep = cepInput.value.replace(/\D/g, '');
        if (cep.length !== 8) {
            alert('CEP inválido. Digite um CEP com 8 dígitos.');
            return;
        }
        buscarEndereco(cep, ruaInput, bairroInput, cidadeInput, estadoInput, 'endereco-completo');
    });

    const finalizarPedido = () => {
        // Lógica existente do checkout
        cartModule.checkout(isPrincipalCheckout);

        // Adicionar pontos ao cliente
        const totalCompra = cartModule.total;
        loyaltyModule.adicionarPontos(totalCompra);

        // Atualizar histórico de pedidos (simulação)
        const cliente = loyaltyModule.getCliente();
        if (cliente) {
            // Simular o tipo do primeiro item no carrinho como o tipo do pedido
            const tipoPedido = cartModule.cart.length > 0 ? cartModule.cart[0].name.split(' ')[0] : 'salgado'; // Pega o primeiro nome do item
            cliente.historicoPedidos.push({
                id: 1, // Simular ID do produto
                tipo: tipoPedido // Simular tipo do produto
            });
            localStorage.setItem("cliente", JSON.stringify(cliente));
            suggestionModule.exibirSugestoesPersonalizadas(); // Exibir sugestões após o pedido
        }

        // Limpar o carrinho
        cartModule.cart.length = 0;
        cartModule.updateCartDisplay();
    };

    // Associe a função finalizarPedido ao evento de clique no botão
    const checkoutButton = document.getElementById('checkoutButton');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', finalizarPedido);
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const container = document.querySelector('.container-coxinhas');
    const coxinha1 = document.getElementById('coxinha1');
    const coxinha2 = document.getElementById('coxinha2');
    const coxinha3 = document.getElementById('coxinha3');
    const coxinha4 = document.getElementById('coxinha4');
    const comentariosDiv = document.querySelector('.comentarios-container');
    const comentarios = document.querySelectorAll('.comentario');
    let comentarioAtual = 0;

    // Função para renderizar as estrelas com base na nota
    function renderizarEstrelas(ratingContainer) {
        const rating = parseFloat(ratingContainer.dataset.rating);
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let stars = '';

        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }

        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }

        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }

        ratingContainer.innerHTML = stars + ` ${rating}`;
    }

    // Inicializa os comentários e as estrelas
    comentarios.forEach((comentario, index) => {
        comentario.style.display = index === 0 ? 'block' : 'none';
        renderizarEstrelas(comentario.querySelector('[data-rating]'));
    });

    // Função para mostrar o próximo comentário
    function mostrarProximoComentario() {
        // Esconde o comentário atual
        comentarios[comentarioAtual].style.display = 'none';
        // Calcula o próximo índice
        comentarioAtual = (comentarioAtual + 1) % comentarios.length;
        // Mostra o próximo comentário
        comentarios[comentarioAtual].style.display = 'block';
    }

    // Define o intervalo para trocar os comentários a cada 5 segundos
    setInterval(mostrarProximoComentario, 5000);

    window.addEventListener('scroll', function () {
        let scrollY = window.scrollY;
        let containerTop = container.offsetTop;
        let windowHeight = window.innerHeight;

        if (scrollY > containerTop - windowHeight && scrollY < containerTop + container.offsetHeight) {
            let relativeScroll = scrollY - (containerTop - windowHeight);

            // Coxinhas interligadas, com rotações suaves e sincronizadas
            coxinha1.style.transform = `translateY(${relativeScroll * 0.08}px) translateX(${Math.sin(relativeScroll * 0.01) * 10}px) rotate(${relativeScroll * 0.01 - 5}deg)`;
            coxinha2.style.transform = `translateY(${relativeScroll * 0.08}px) translateX(${Math.cos(relativeScroll * 0.01) * 10}px) rotate(${relativeScroll * -0.01 + 175}deg)`;
            coxinha3.style.transform = `translateY(${relativeScroll * 0.08}px) translateX(${Math.sin(relativeScroll * 0.01) * -10}px) rotate(${relativeScroll * 0.01 + 5}deg)`;
            coxinha4.style.transform = `translateY(${relativeScroll * 0.08}px) translateX(${Math.cos(relativeScroll * 0.01) * -10}px) rotate(${relativeScroll * -0.01 - 3}deg)`;

            // Verificar se as coxinhas estão atrás dos comentários/avaliações
            const coxinhas = [coxinha1, coxinha2, coxinha3, coxinha4];
            const blurValues = [0, 1, 3, 5]; // Intensidades de blur para cada coxinha

            coxinhas.forEach((coxinha, index) => {
                const coxinhaRect = coxinha.getBoundingClientRect();
                const comentariosRect = comentariosDiv.getBoundingClientRect();

                // Calcula a interseção entre a coxinha e a div de comentários
                const intersectionTop = Math.max(coxinhaRect.top, comentariosRect.top);
                const intersectionBottom = Math.min(coxinhaRect.bottom, comentariosRect.bottom);
                const intersectionLeft = Math.max(coxinhaRect.left, comentariosRect.left);
                const intersectionRight = Math.min(coxinhaRect.right, comentariosRect.right);

                const intersectionWidth = Math.max(0, intersectionRight - intersectionLeft);
                const intersectionHeight = Math.max(0, intersectionBottom - intersectionTop);

                const coxinhaArea = coxinhaRect.width * coxinhaRect.height;
                const intersectionArea = intersectionWidth * intersectionHeight;

                // Calcula a porcentagem da coxinha que está dentro da div de comentários
                const percentageInside = (intersectionArea / coxinhaArea) * 100;

                // Define o desfoque baseado na porcentagem de cobertura
                if (percentageInside > 0) {
                    coxinha.style.filter = `blur(${blurValues[index] * (percentageInside / 100)}px)`;
                } else {
                    coxinha.style.filter = 'none';
                }
            });
        } else {
            coxinha1.style.transform = 'translateY(0) rotate(-5deg)';
            coxinha2.style.transform = 'translateY(0) rotate(175deg)';
            coxinha3.style.transform = 'translateY(0) rotate(5deg)';
            coxinha4.style.transform = 'translateY(0) rotate(-3deg)';
            coxinha1.style.filter = 'none';
            coxinha2.style.filter = 'none';
            coxinha3.style.filter = 'none';
            coxinha4.style.filter = 'none';
        }
    });
});

const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mainNav = document.querySelector('.main-nav'); // Ou o ul: .main-nav-links
const toggleThemeButton = document.getElementById('toggleTheme');
const body = document.body;

if (mobileMenuToggle && mainNav) {
    mobileMenuToggle.addEventListener('click', () => {
        const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
        mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
        mainNav.classList.toggle('active'); // Adiciona/remove classe para mostrar/esconder
        // Opcional: Altera ícone do botão
         mobileMenuToggle.querySelector('i').classList.toggle('fa-bars');
         mobileMenuToggle.querySelector('i').classList.toggle('fa-times');
    });
}

// Lógica do botão de tema (adapte conforme sua implementação de tema escuro)
if (toggleThemeButton) {
    // Verifica tema salvo ou preferência do sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme === 'dark' || (!currentTheme && prefersDark)) {
         body.classList.add('theme-dark');
    } else {
         body.classList.remove('theme-dark'); // Garante estado inicial claro se não for dark
    }


    toggleThemeButton.addEventListener('click', () => {
        body.classList.toggle('theme-dark');
        // Salva a preferência
        if (body.classList.contains('theme-dark')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
            localStorage.removeItem('theme'); // Ou remova explicitamente
        }
    });
     // Atualiza ícones no botão de tema (exemplo inicial)
     function updateThemeIcons() {
        const isDark = body.classList.contains('theme-dark');
        const moonIcon = toggleThemeButton.querySelector('.fa-moon');
        const sunIcon = toggleThemeButton.querySelector('.fa-sun');
        if (moonIcon && sunIcon) {
            moonIcon.style.display = isDark ? 'none' : 'inline-block';
            sunIcon.style.display = isDark ? 'inline-block' : 'none';
        }
    }
     updateThemeIcons(); // Chamar na inicialização
     toggleThemeButton.addEventListener('click', updateThemeIcons); // Chamar ao clicar
}

function toggleCart() {
    const cartMenu = document.getElementById('cart-menu');
    cartMenu.classList.toggle('open'); // Alterna a classe 'open' para mostrar/ocultar o carrinho
}