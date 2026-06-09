// ============================================
// 應用狀態管理
// ============================================
const appState = {
    words: [],
    currentIndex: 0,
    isFlipped: false,
};

// ============================================
// DOM 元素引用
// ============================================
const elements = {
    // Navigation
    navBtns: document.querySelectorAll('.nav-btn'),
    flashcardPage: document.getElementById('flashcard-page'),
    managePage: document.getElementById('manage-page'),

    // Flashcard
    flashcard: document.getElementById('flashcard'),
    frontWord: document.getElementById('front-word'),
    backTranslation: document.getElementById('back-translation'),
    backPos: document.getElementById('back-pos'),
    backExample: document.getElementById('back-example'),
    backEtymology: document.getElementById('back-etymology'),
    cardCount: document.getElementById('card-count'),
    progressFill: document.getElementById('progress-fill'),

    // Buttons
    flipBtn: document.getElementById('flip-btn'),
    nextBtn: document.getElementById('next-btn'),
    prevBtn: document.getElementById('prev-btn'),
    resetBtn: document.getElementById('reset-btn'),

    // Manage Form
    addWordForm: document.getElementById('add-word-form'),
    wordInput: document.getElementById('word-input'),
    translationInput: document.getElementById('translation-input'),
    posInput: document.getElementById('pos-input'),
    exampleInput: document.getElementById('example-input'),
    etymologyInput: document.getElementById('etymology-input'),
    autoFillBtn: document.getElementById('auto-fill-btn'),
    wordList: document.getElementById('word-list'),
    wordCount: document.getElementById('word-count'),

    // Utilities
    loadingIndicator: document.getElementById('loading-indicator'),
    notification: document.getElementById('notification'),
};

// ============================================
// 初始化
// ============================================
function init() {
    loadWordsFromStorage();
    setupEventListeners();
    if (appState.words.length === 0) {
        loadDefaultWords();
    }
    renderFlashcard();
    renderWordList();
}

function setupEventListeners() {
    // Navigation
    elements.navBtns.forEach(btn => {
        btn.addEventListener('click', handleNavigation);
    });

    // Flashcard Controls
    elements.flipBtn.addEventListener('click', toggleFlip);
    elements.nextBtn.addEventListener('click', nextCard);
    elements.prevBtn.addEventListener('click', prevCard);
    elements.resetBtn.addEventListener('click', resetCards);
    elements.flashcard.addEventListener('click', toggleFlip);

    // Manage Form
    elements.addWordForm.addEventListener('submit', handleAddWord);
    elements.autoFillBtn.addEventListener('click', handleAutoFill);
}

// ============================================
// 導航功能
// ============================================
function handleNavigation(e) {
    const page = e.target.dataset.page;
    
    // 更新導航按鈕
    elements.navBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    // 切換頁面
    elements.flashcardPage.classList.toggle('active', page === 'flashcard');
    elements.managePage.classList.toggle('active', page === 'manage');

    // 重置翻頁狀態
    appState.isFlipped = false;
    elements.flashcard.classList.remove('flipped');
    
    // 重新渲染
    if (page === 'manage') {
        renderWordList();
    }
}

// ============================================
// 卡片翻頁功能
// ============================================
function toggleFlip() {
    appState.isFlipped = !appState.isFlipped;
    elements.flashcard.classList.toggle('flipped');
}

function nextCard() {
    if (appState.currentIndex < appState.words.length - 1) {
        appState.currentIndex++;
        appState.isFlipped = false;
        elements.flashcard.classList.remove('flipped');
        renderFlashcard();
    }
}

function prevCard() {
    if (appState.currentIndex > 0) {
        appState.currentIndex--;
        appState.isFlipped = false;
        elements.flashcard.classList.remove('flipped');
        renderFlashcard();
    }
}

function resetCards() {
    appState.currentIndex = 0;
    appState.isFlipped = false;
    elements.flashcard.classList.remove('flipped');
    renderFlashcard();
}

// ============================================
// 渲染卡片
// ============================================
function renderFlashcard() {
    const word = appState.words[appState.currentIndex];
    
    if (!word) {
        showNotification('沒有單字可學習', 'warning');
        return;
    }

    // 更新正面（英文）
    elements.frontWord.textContent = word.word;

    // 更新背面（詳細信息）
    elements.backTranslation.textContent = word.translation || '未知';
    elements.backPos.textContent = word.partOfSpeech || '未知';
    elements.backExample.textContent = word.example || '暫無例句';
    elements.backEtymology.textContent = word.etymology || '暫無分析';

    // 更新計數和進度
    elements.cardCount.textContent = `${appState.currentIndex + 1} / ${appState.words.length}`;
    const progress = ((appState.currentIndex + 1) / appState.words.length) * 100;
    elements.progressFill.style.width = progress + '%';

    // 更新按鈕狀態
    elements.prevBtn.disabled = appState.currentIndex === 0;
    elements.nextBtn.disabled = appState.currentIndex === appState.words.length - 1;
}

// ============================================
// 管理頁面 - 新增單字
// ============================================
async function handleAddWord(e) {
    e.preventDefault();

    const word = {
        id: Date.now(),
        word: elements.wordInput.value.trim(),
        translation: elements.translationInput.value.trim(),
        partOfSpeech: elements.posInput.value.trim(),
        example: elements.exampleInput.value.trim(),
        etymology: elements.etymologyInput.value.trim(),
    };

    if (!word.word) {
        showNotification('請輸入單字', 'error');
        return;
    }

    // 檢查重複
    if (appState.words.some(w => w.word.toLowerCase() === word.word.toLowerCase())) {
        showNotification('此單字已存在', 'error');
        return;
    }

    appState.words.push(word);
    saveWordsToStorage();
    renderWordList();
    elements.addWordForm.reset();
    showNotification('單字新增成功！', 'success');

    // 如果是第一個單字，自動切換到學習頁面
    if (appState.words.length === 1) {
        renderFlashcard();
    }
}

// ============================================
// API 自動填入功能
// ============================================
async function handleAutoFill() {
    const word = elements.wordInput.value.trim();

    if (!word) {
        showNotification('請先輸入單字', 'error');
        return;
    }

    // 檢查重複
    if (appState.words.some(w => w.word.toLowerCase() === word.toLowerCase())) {
        showNotification('此單字已存在', 'error');
        return;
    }

    showLoading(true);
    elements.autoFillBtn.disabled = true;

    try {
        // 嘗試從 Free Dictionary API 獲取數據
        const data = await fetchWordData(word);
        
        if (data) {
            elements.translationInput.value = data.translation || '';
            elements.posInput.value = data.partOfSpeech || '';
            elements.exampleInput.value = data.example || '';
            elements.etymologyInput.value = data.etymology || '';
            showNotification('自動填入成功！', 'success');
        } else {
            showNotification('找不到該單字的信息，請手動填入', 'warning');
        }
    } catch (error) {
        console.error('自動填入失敗:', error);
        showNotification('自動填入失敗，請手動填入', 'error');
    } finally {
        showLoading(false);
        elements.autoFillBtn.disabled = false;
    }
}

// ============================================
// API 調用
// ============================================
async function fetchWordData(word) {
    try {
        const response = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/english/${word.toLowerCase()}`
        );

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        const entry = data[0];

        if (!entry) {
            return null;
        }

        // 提取翻譯
        let translation = '';
        if (entry.meanings && entry.meanings.length > 0) {
            const meaning = entry.meanings[0];
            if (meaning.definitions && meaning.definitions.length > 0) {
                translation = meaning.definitions[0].definition || '';
            }
        }

        // 提取詞性
        let partOfSpeech = '';
        if (entry.meanings && entry.meanings.length > 0) {
            partOfSpeech = entry.meanings[0].partOfSpeech || '';
        }

        // 提取例句
        let example = '';
        if (entry.meanings && entry.meanings.length > 0) {
            const meaning = entry.meanings[0];
            if (meaning.definitions && meaning.definitions.length > 0) {
                example = meaning.definitions[0].example || '';
            }
        }

        // 提取字根分析
        let etymology = '';
        if (entry.meanings && entry.meanings.length > 0) {
            const meaning = entry.meanings[0];
            if (meaning.definitions && meaning.definitions.length > 0) {
                etymology = meaning.definitions[0].synonyms?.join(', ') || '';
            }
        }

        // 如果沒有字根，嘗試從 origin 字段獲取
        if (!etymology && entry.origin) {
            etymology = entry.origin;
        }

        // 如果沒有字根，使用通用信息
        if (!etymology) {
            etymology = `${word} 是英文詞彙`;
        }

        return {
            translation: translation,
            partOfSpeech: partOfSpeech,
            example: example,
            etymology: etymology,
        };
    } catch (error) {
        console.error('API 調用失敗:', error);
        return null;
    }
}

// ============================================
// 單字列表
// ============================================
function renderWordList() {
    elements.wordList.innerHTML = '';
    elements.wordCount.textContent = appState.words.length;

    if (appState.words.length === 0) {
        elements.wordList.innerHTML = '<p style="text-align: center; color: #999;">還沒有單字，點擊「新增單字」開始吧！</p>';
        return;
    }

    appState.words.forEach(word => {
        const wordItem = createWordItem(word);
        elements.wordList.appendChild(wordItem);
    });
}

function createWordItem(word) {
    const item = document.createElement('div');
    item.className = 'word-item';
    item.innerHTML = `
        <div class="word-item-content">
            <div class="word-item-word">${word.word}</div>
            <div class="word-item-details">
                <strong>翻譯:</strong> ${word.translation}<br>
                <strong>詞性:</strong> ${word.partOfSpeech}
            </div>
        </div>
        <button class="delete-btn" data-id="${word.id}">刪除</button>
    `;

    const deleteBtn = item.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deleteWord(word.id));

    return item;
}

function deleteWord(id) {
    if (confirm('確定要刪除此單字嗎？')) {
        appState.words = appState.words.filter(w => w.id !== id);
        saveWordsToStorage();
        renderWordList();
        
        // 如果刪除的是當前卡片，重新渲染
        if (appState.currentIndex >= appState.words.length && appState.words.length > 0) {
            appState.currentIndex = appState.words.length - 1;
        }
        if (appState.words.length > 0) {
            renderFlashcard();
        }
        
        showNotification('單字已刪除', 'success');
    }
}

// ============================================
// 本地存儲
// ============================================
const STORAGE_KEY = 'vocabulary_words';

function saveWordsToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.words));
}

function loadWordsFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            appState.words = JSON.parse(stored);
        } catch (error) {
            console.error('載入存儲失敗:', error);
            appState.words = [];
        }
    }
}

// ============================================
// 默認單字
// ============================================
function loadDefaultWords() {
    const defaultWords = [
        {
            id: 1,
            word: 'Hello',
            translation: '你好、打招呼',
            partOfSpeech: 'interjection',
            example: 'Hello, how are you today?',
            etymology: '來自 hello (16世紀)，用於打招呼',
        },
        {
            id: 2,
            word: 'Serendipity',
            translation: '幸運巧合、美妙的際遇',
            partOfSpeech: 'noun',
            example: 'Meeting her was pure serendipity.',
            etymology: '來自波斯童話《三王子歷險記》中的"Serendip"',
        },
        {
            id: 3,
            word: 'Ephemeral',
            translation: '短暫的、轉瞬即逝的',
            partOfSpeech: 'adjective',
            example: 'The beauty of cherry blossoms is ephemeral.',
            etymology: '來自希臘文 ephemeros（只活一天）',
        },
        {
            id: 4,
            word: 'Eloquent',
            translation: '雄辯的、表達流暢的',
            partOfSpeech: 'adjective',
            example: 'She gave an eloquent speech about climate change.',
            etymology: '來自拉丁文 eloquens（善於表達）',
        },
        {
            id: 5,
            word: 'Perseverance',
            translation: '堅持不懈、毅力',
            partOfSpeech: 'noun',
            example: 'Success requires perseverance and hard work.',
            etymology: '來自拉丁文 perseverare（堅持）',
        },
    ];

    appState.words = defaultWords;
    saveWordsToStorage();
}

// ============================================
// UI 輔助函數
// ============================================
function showLoading(show) {
    if (show) {
        elements.loadingIndicator.classList.remove('hidden');
    } else {
        elements.loadingIndicator.classList.add('hidden');
    }
}

function showNotification(message, type = 'success') {
    elements.notification.textContent = message;
    elements.notification.className = `notification show ${type}`;

    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

// ============================================
// 啟動應用
// ============================================
document.addEventListener('DOMContentLoaded', init);
