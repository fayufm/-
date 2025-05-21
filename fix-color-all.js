// 统一修复所有颜色相关问题
const { ipcRenderer } = require('electron');

console.log('[颜色全局修复] 脚本开始加载...');

// 全局变量，用于保存颜色选择
let selectedTitleColor = null;
let selectedBgColor = null;

// 在DOM完全加载后执行初始化
document.addEventListener('DOMContentLoaded', () => {
  // 防止过早执行，等待所有元素加载完成
  setTimeout(initColorFixes, 1000);
});

// 页面加载完成后再次初始化，以防万一
window.addEventListener('load', () => {
  setTimeout(initColorFixes, 1500);
});

// 主初始化函数
function initColorFixes() {
  console.log('[颜色全局修复] 开始初始化...');
  
  // 首先检查必要的元素是否存在
  const colorDialog = document.getElementById('title-color-dialog');
  const confirmBtn = document.getElementById('title-color-confirm-btn');
  
  if (!colorDialog || !confirmBtn) {
    console.log('[颜色全局修复] 关键元素未找到，稍后重试...');
    setTimeout(initColorFixes, 500);
    return;
  }
  
  // 确保旧的颜色处理函数被禁用
  disableOldColorHandlers();
  
  // 修复确认按钮
  fixConfirmButton();
  
  // 修复颜色选择器点击事件
  fixColorSelectors();
  
  // 替换应用颜色的函数
  replaceApplyTitleColorFunction();
  
  // 隐藏文体类型颜色部分
  hideGenreColorSection();
  
  console.log('[颜色全局修复] 初始化完成!');
}

// 禁用旧的颜色处理函数
function disableOldColorHandlers() {
  console.log('[颜色全局修复] 禁用旧的颜色处理函数...');
  
  // 将原始函数保存为备份
  if (typeof window._originalApplyTitleColor === 'undefined' && 
      typeof window.applyTitleColor === 'function') {
    window._originalApplyTitleColor = window.applyTitleColor;
  }
  
  // 清除可能的定时器和监听器
  if (window._colorUpdateInterval) {
    clearInterval(window._colorUpdateInterval);
  }
}

// 隐藏文体类型颜色部分
function hideGenreColorSection() {
  // 隐藏文体类型颜色选择区域
  const genreColorSection = document.getElementById('genre-color-section');
  if (genreColorSection) {
    genreColorSection.style.display = 'none';
    console.log('[颜色全局修复] 隐藏文体类型颜色部分');
  }
}

// 修复确认按钮事件
function fixConfirmButton() {
  console.log('[颜色全局修复] 修复确认按钮事件...');
  
  const confirmBtn = document.getElementById('title-color-confirm-btn');
  if (!confirmBtn) return;
  
  // 移除所有现有的事件监听器
  const newBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
  
  // 添加新的事件监听器
  newBtn.addEventListener('click', function(e) {
    console.log('[颜色全局修复] 确认按钮被点击');
    
    // 阻止事件冒泡
    e.stopPropagation();
    
    // 更新全局颜色变量
    updateSelectedColors();
    
    // 应用颜色
    window.applyTitleColor();
  });
}

// 更新选中的颜色值到全局变量
function updateSelectedColors() {
  // 获取标题颜色
  const titleColorElement = document.querySelector('.title-color-option.selected');
  if (titleColorElement) {
    selectedTitleColor = titleColorElement.dataset.color;
  } else {
    const customTitleColor = document.getElementById('custom-title-color');
    if (customTitleColor && customTitleColor.value) {
      selectedTitleColor = customTitleColor.value;
    }
  }
  
  // 获取背景颜色
  const bgColorElement = document.querySelector('.bg-color-option.selected');
  if (bgColorElement) {
    selectedBgColor = bgColorElement.dataset.color;
  } else {
    const customBgColor = document.getElementById('custom-bg-color');
    if (customBgColor && customBgColor.value) {
      selectedBgColor = customBgColor.value;
    }
  }
  
  // 确保全局变量与我们的局部变量同步
  window.selectedTitleColor = selectedTitleColor;
  window.selectedBgColor = selectedBgColor;
  
  console.log(`[颜色全局修复] 选择的颜色 - 标题: ${selectedTitleColor}, 背景: ${selectedBgColor}`);
}

// 修复颜色选择器事件
function fixColorSelectors() {
  console.log('[颜色全局修复] 修复颜色选择器事件...');
  
  // 修复标题颜色选择器
  const titleColorOptions = document.querySelectorAll('.title-color-option');
  titleColorOptions.forEach(option => {
    const newOption = option.cloneNode(true);
    option.parentNode.replaceChild(newOption, option);
    
    newOption.addEventListener('click', function(e) {
      e.stopPropagation();
      
      titleColorOptions.forEach(o => o.classList.remove('selected'));
      this.classList.add('selected');
      
      const customTitleColor = document.getElementById('custom-title-color');
      if (customTitleColor) {
        customTitleColor.value = this.dataset.color;
      }
      
      // 预览标题颜色
      previewTitleColor(this.dataset.color);
      
      console.log(`[颜色全局修复] 选择了标题颜色: ${this.dataset.color}`);
    });
  });
  
  // 修复背景颜色选择器
  const bgColorOptions = document.querySelectorAll('.bg-color-option');
  bgColorOptions.forEach(option => {
    const newOption = option.cloneNode(true);
    option.parentNode.replaceChild(newOption, option);
    
    newOption.addEventListener('click', function(e) {
      e.stopPropagation();
      
      bgColorOptions.forEach(o => o.classList.remove('selected'));
      this.classList.add('selected');
      
      const customBgColor = document.getElementById('custom-bg-color');
      if (customBgColor) {
        customBgColor.value = this.dataset.color;
      }
      
      console.log(`[颜色全局修复] 选择了背景颜色: ${this.dataset.color}`);
    });
  });
  
  // 修复自定义颜色输入
  const customTitleColor = document.getElementById('custom-title-color');
  if (customTitleColor) {
    const newCustomTitle = customTitleColor.cloneNode(true);
    customTitleColor.parentNode.replaceChild(newCustomTitle, customTitleColor);
    
    newCustomTitle.addEventListener('input', function() {
      titleColorOptions.forEach(o => o.classList.remove('selected'));
      
      // 预览标题颜色
      previewTitleColor(this.value);
      
      console.log(`[颜色全局修复] 输入了自定义标题颜色: ${this.value}`);
    });
  }
  
  const customBgColor = document.getElementById('custom-bg-color');
  if (customBgColor) {
    const newCustomBg = customBgColor.cloneNode(true);
    customBgColor.parentNode.replaceChild(newCustomBg, customBgColor);
    
    newCustomBg.addEventListener('input', function() {
      bgColorOptions.forEach(o => o.classList.remove('selected'));
      console.log(`[颜色全局修复] 输入了自定义背景颜色: ${this.value}`);
    });
  }
}

// 预览标题颜色 - 不改变文体类型颜色
function previewTitleColor(color) {
  const noteTitleElement = document.getElementById('note-title-display');
  if (noteTitleElement) {
    // 保存文体类型标签的颜色和样式
    const genreBadge = noteTitleElement.querySelector('.genre-badge');
    if (genreBadge) {
      // 获取当前文体类型标签的颜色
      const genreBadgeColor = window.getComputedStyle(genreBadge).color;
      
      // 先应用标题颜色
      noteTitleElement.style.color = color;
      
      // 然后确保文体类型标签保持其独立颜色
      const currentColor = genreBadge.style.getPropertyValue('--genre-color') || genreBadge.style.color || genreBadgeColor;
      genreBadge.style.setProperty('--genre-color', currentColor);
      genreBadge.style.color = currentColor;
      
      console.log(`[颜色全局修复] 保留文体类型标签颜色: ${currentColor}`);
    } else {
      // 没有文体类型标签，直接应用标题颜色
      noteTitleElement.style.color = color;
    }
  }
}

// 替换应用颜色的函数
function replaceApplyTitleColorFunction() {
  console.log('[颜色全局修复] 替换应用颜色函数...');
  
  // 完全替换原始函数
  window.applyTitleColor = async function() {
    console.log('[颜色全局修复] 开始应用颜色...');
    
    try {
      // 首先检查是否选择了任何颜色
      if (!selectedTitleColor && !selectedBgColor) {
        console.log('[颜色全局修复] 没有选择任何颜色，取消设置');
        hideTitleColorDialog();
        return;
      }
      
      // 确保有当前笔记ID
      const currentNoteId = window.currentNoteId;
      if (!currentNoteId) {
        console.error('[颜色全局修复] 没有当前笔记ID，无法应用颜色');
        hideTitleColorDialog();
        return;
      }
      
      // 获取笔记数据
      const note = await ipcRenderer.invoke('get-note', currentNoteId);
      if (!note) {
        console.error('[颜色全局修复] 获取笔记数据失败');
        return;
      }
      
      // 检查笔记是否有内容
      const hasContent = note.content && note.content.trim() !== '';
      
      // 更新笔记元数据
      const updatedMetadata = note.metadata || {};
      
      // 只在笔记有内容且选择了标题颜色时更新标题颜色
      if (selectedTitleColor && hasContent) {
        updatedMetadata.titleColor = selectedTitleColor;
      }
      
      // 只在选择了背景颜色时更新背景颜色
      if (selectedBgColor) {
        updatedMetadata.bgColor = selectedBgColor;
      }
      
      // 保存已有的文体类型颜色
      const existingGenreColor = updatedMetadata.genreColor;
      
      // 保存更新后的元数据
      await ipcRenderer.invoke('update-note-metadata', currentNoteId, updatedMetadata);
      console.log('[颜色全局修复] 已保存更新的笔记元数据');
      
      // 更新标题颜色 - 只在笔记有内容且选择了标题颜色时应用
      const noteTitleElement = document.getElementById('note-title-display');
      if (noteTitleElement && selectedTitleColor && hasContent) {
        // 获取文体类型标签
        const genreBadge = noteTitleElement.querySelector('.genre-badge');
        
        // 先应用标题颜色
        noteTitleElement.style.color = selectedTitleColor;
        console.log('[颜色全局修复] 已应用标题颜色到编辑器DOM (笔记有内容)');
        
        // 确保文体类型标签保持其颜色
        if (genreBadge) {
          // 获取所有可能的颜色源
          const currentColor = genreBadge.style.getPropertyValue('--genre-color') || 
                              existingGenreColor ||
                              genreBadge.style.color;
          
          if (currentColor) {
            genreBadge.style.setProperty('--genre-color', currentColor);
            genreBadge.style.color = currentColor;
            console.log(`[颜色全局修复] 已保持文体类型标签颜色: ${currentColor}`);
          }
        }
      } else if (selectedTitleColor && !hasContent) {
        console.log('[颜色全局修复] 笔记没有内容，不应用标题颜色');
      }
      
      // 更新笔记列表中对应项的颜色
      const noteItem = document.querySelector(`.note-item[data-id="${currentNoteId}"]`);
      if (noteItem) {
        // 更新背景颜色
        if (selectedBgColor) {
          noteItem.style.backgroundColor = selectedBgColor;
          noteItem.classList.add('custom-bg');
          console.log('[颜色全局修复] 已应用背景颜色到列表DOM');
        }
        
        // 更新标题颜色 - 只在笔记有内容且选择了标题颜色时应用
        if (selectedTitleColor && hasContent) {
          const titleElement = noteItem.querySelector('.note-title-text');
          if (titleElement) {
            // 获取文体类型标签
            const genreBadge = titleElement.querySelector('.genre-badge');
            
            // 先应用标题颜色
            titleElement.style.color = selectedTitleColor;
            console.log('[颜色全局修复] 已应用标题颜色到列表DOM');
            
            // 确保文体类型标签保持其颜色
            if (genreBadge) {
              // 获取所有可能的颜色源
              const currentColor = genreBadge.style.getPropertyValue('--genre-color') || 
                                  existingGenreColor ||
                                  genreBadge.style.color;
              
              if (currentColor) {
                genreBadge.style.setProperty('--genre-color', currentColor);
                genreBadge.style.color = currentColor;
                console.log(`[颜色全局修复] 已保持列表项文体类型标签颜色: ${currentColor}`);
              }
            }
          }
        }
      }
      
      // 隐藏对话框
      hideTitleColorDialog();
      
      // 触发颜色更新事件，通知其他组件
      document.dispatchEvent(new CustomEvent('titleColorUpdated', {
        detail: {
          noteId: currentNoteId,
          titleColor: selectedTitleColor,
          bgColor: selectedBgColor,
          hasContent: hasContent
        }
      }));
      
      // 清理全局颜色变量
      selectedTitleColor = null;
      selectedBgColor = null;
      
      // 如果存在updateListColors函数，调用它更新整个列表
      if (typeof window.updateListColors === 'function') {
        setTimeout(() => {
          window.updateListColors();
          console.log('[颜色全局修复] 已刷新列表颜色');
        }, 300);
      }
      
      console.log('[颜色全局修复] 颜色应用完成');
    } catch (err) {
      console.error('[颜色全局修复] 应用颜色时出错:', err);
      
      // 出错时也隐藏对话框
      hideTitleColorDialog();
    }
  };
  
  // 修改 showTitleColorDialog 函数
  const originalShowTitleColorDialog = window.showTitleColorDialog;
  if (typeof originalShowTitleColorDialog === 'function') {
    window.showTitleColorDialog = function() {
      const genreColorSection = document.getElementById('genre-color-section');
      if (genreColorSection) {
        genreColorSection.style.display = 'none';
      }
      
      // 调用原始函数
      return originalShowTitleColorDialog.apply(this, arguments);
    };
  }
  
  // 设置函数来源标记
  window.applyTitleColor.source = 'fix-color-all.js';
  
  console.log('[颜色全局修复] 应用颜色函数已替换');
}

// 隐藏标题颜色对话框
function hideTitleColorDialog() {
  const dialog = document.getElementById('title-color-dialog');
  if (dialog) {
    dialog.classList.add('hidden');
  }
}

// 添加适当的CSS规则，确保文体类型颜色不会被覆盖
function addCSSFixes() {
  console.log('[颜色全局修复] 添加CSS修复...');
  
  const style = document.createElement('style');
  style.textContent = `
    /* 确保文体类型标签属性样式优先级高于标题样式 */
    .genre-badge {
      color: var(--genre-color, inherit) !important; /* 使用CSS变量存储文体类型颜色 */
    }
    
    /* 当通过style属性设置颜色时，使用内联样式的颜色 */
    .genre-badge[style*="color"] {
      color: unset !important; /* 移除继承，让内联样式生效 */
    }
    
    /* 添加更强的选择器确保文体类型样式不被覆盖 */
    .note-title-text .genre-badge,
    #note-title-display .genre-badge {
      display: inline-block !important;
      font-size: 0.8em !important;
      font-style: italic !important;
      font-family: 'Kaiti', 'STKaiti', 'FangSong', 'STFangSong', cursive !important;
      font-weight: normal !important;
      letter-spacing: 1px !important;
    }
    
    /* 确保选中的颜色选项有明显的视觉反馈 */
    .color-option.selected {
      box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.8);
      transform: scale(1.1);
      z-index: 1;
    }
  `;
  
  document.head.appendChild(style);
  console.log('[颜色全局修复] CSS修复已添加');
}

// 初始化时添加CSS修复
addCSSFixes();

console.log('[颜色全局修复] 脚本加载完成'); 