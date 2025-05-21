// 文体类型颜色按钮和对话框脚本
const { ipcRenderer } = require('electron');

console.log('[文体类型颜色] 脚本开始加载...');

// 在DOM完全加载后执行初始化
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initGenreColorButton, 1000);
});

// 页面加载完成后再次初始化，以防万一
window.addEventListener('load', () => {
  setTimeout(initGenreColorButton, 1500);
});

// 初始化文体类型颜色按钮
function initGenreColorButton() {
  console.log('[文体类型颜色] 开始初始化按钮...');

  // 检查是否需要添加按钮
  const noteControls = document.querySelector('#note-controls .action-buttons-group');
  const existingButton = document.getElementById('genre-color-btn');
  
  if (!noteControls || existingButton) {
    setTimeout(initGenreColorButton, 500);
    return;
  }
  
  // 创建按钮
  const genreColorBtn = document.createElement('button');
  genreColorBtn.id = 'genre-color-btn';
  genreColorBtn.className = 'action-button-small';
  genreColorBtn.title = '类型颜色';
  genreColorBtn.innerHTML = '<span>🎭</span>';
  
  // 插入到标题颜色按钮之前
  const titleColorBtn = document.getElementById('title-color-btn');
  if (titleColorBtn) {
    noteControls.insertBefore(genreColorBtn, titleColorBtn);
  } else {
    noteControls.appendChild(genreColorBtn);
  }
  
  // 添加点击事件处理
  genreColorBtn.addEventListener('click', showGenreColorDialog);
  
  // 创建对话框
  createGenreColorDialog();
  
  console.log('[文体类型颜色] 按钮初始化完成');
}

// 创建文体类型颜色对话框
function createGenreColorDialog() {
  console.log('[文体类型颜色] 创建对话框...');
  
  // 检查是否已存在对话框
  let dialog = document.getElementById('genre-color-dialog');
  
  if (dialog) {
    return; // 对话框已存在，不需要重新创建
  }
  
  // 创建对话框元素
  dialog = document.createElement('div');
  dialog.id = 'genre-color-dialog';
  dialog.className = 'dialog hidden';
  
  // 设置对话框内容
  dialog.innerHTML = `
    <div class="dialog-content">
      <h2>文体类型颜色</h2>
      <div class="color-section">
        <div class="color-picker-container">
          <div class="preset-colors">
            <div class="color-option genre-color-option" data-color="#ff6b6b" style="background-color: #ff6b6b;"></div>
            <div class="color-option genre-color-option" data-color="#ff922b" style="background-color: #ff922b;"></div>
            <div class="color-option genre-color-option" data-color="#fcc419" style="background-color: #fcc419;"></div>
            <div class="color-option genre-color-option" data-color="#51cf66" style="background-color: #51cf66;"></div>
            <div class="color-option genre-color-option" data-color="#339af0" style="background-color: #339af0;"></div>
            <div class="color-option genre-color-option" data-color="#5f3dc4" style="background-color: #5f3dc4;"></div>
            <div class="color-option genre-color-option" data-color="#845ef7" style="background-color: #845ef7;"></div>
            <div class="color-option genre-color-option" data-color="#f06595" style="background-color: #f06595;"></div>
          </div>
          <div class="custom-color">
            <label>自定义颜色：</label>
            <input type="color" id="custom-genre-color" value="#339af0">
          </div>
        </div>
      </div>
      <div class="dialog-buttons">
        <button id="genre-color-cancel-btn">取消</button>
        <button id="genre-color-confirm-btn">确定</button>
      </div>
    </div>
  `;
  
  // 添加到文档中
  document.body.appendChild(dialog);
  
  // 添加事件监听
  const cancelBtn = document.getElementById('genre-color-cancel-btn');
  const confirmBtn = document.getElementById('genre-color-confirm-btn');
  
  cancelBtn.addEventListener('click', hideGenreColorDialog);
  confirmBtn.addEventListener('click', applyGenreColor);
  
  // 添加颜色选择器事件
  const colorOptions = document.querySelectorAll('.genre-color-option');
  colorOptions.forEach(option => {
    option.addEventListener('click', function(e) {
      e.stopPropagation();
      
      colorOptions.forEach(o => o.classList.remove('selected'));
      this.classList.add('selected');
      
      const customColorInput = document.getElementById('custom-genre-color');
      if (customColorInput) {
        customColorInput.value = this.dataset.color;
      }
      
      // 预览颜色
      previewGenreColor(this.dataset.color);
    });
  });
  
  // 自定义颜色输入事件
  const customColorInput = document.getElementById('custom-genre-color');
  if (customColorInput) {
    customColorInput.addEventListener('input', function() {
      colorOptions.forEach(o => o.classList.remove('selected'));
      
      // 预览颜色
      previewGenreColor(this.value);
    });
  }
  
  console.log('[文体类型颜色] 对话框创建完成');
}

// 显示文体类型颜色对话框
function showGenreColorDialog() {
  console.log('[文体类型颜色] 显示对话框...');
  
  // 检查是否有当前笔记
  const currentNoteId = window.currentNoteId;
  if (!currentNoteId) {
    console.error('[文体类型颜色] 没有当前笔记ID');
    return;
  }
  
  // 获取对话框元素
  const dialog = document.getElementById('genre-color-dialog');
  if (!dialog) {
    console.error('[文体类型颜色] 对话框不存在');
    return;
  }
  
  // 获取当前笔记的文体类型颜色
  ipcRenderer.invoke('get-note', currentNoteId).then(note => {
    if (note && note.metadata && note.metadata.genreColor) {
      // 如果笔记有文体类型颜色，高亮对应选项
      const colorOptions = document.querySelectorAll('.genre-color-option');
      const customColorInput = document.getElementById('custom-genre-color');
      
      let found = false;
      colorOptions.forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.color === note.metadata.genreColor) {
          option.classList.add('selected');
          found = true;
        }
      });
      
      if (!found && customColorInput) {
        customColorInput.value = note.metadata.genreColor;
      }
    }
    
    // 显示对话框
    dialog.classList.remove('hidden');
  });
}

// 隐藏文体类型颜色对话框
function hideGenreColorDialog() {
  const dialog = document.getElementById('genre-color-dialog');
  if (dialog) {
    dialog.classList.add('hidden');
  }
}

// 预览文体类型颜色
function previewGenreColor(color) {
  const noteTitleElement = document.getElementById('note-title-display');
  if (noteTitleElement) {
    const genreBadge = noteTitleElement.querySelector('.genre-badge');
    if (genreBadge) {
      genreBadge.style.setProperty('--genre-color', color);
      genreBadge.style.color = color;
      console.log(`[文体类型颜色] 预览颜色: ${color}`);
    } else {
      console.log('[文体类型颜色] 未找到文体类型标签');
    }
  }
}

// 应用文体类型颜色
async function applyGenreColor() {
  console.log('[文体类型颜色] 应用颜色...');
  
  // 获取选中的颜色
  let selectedColor = null;
  
  const selectedOption = document.querySelector('.genre-color-option.selected');
  if (selectedOption) {
    selectedColor = selectedOption.dataset.color;
  } else {
    const customColorInput = document.getElementById('custom-genre-color');
    if (customColorInput) {
      selectedColor = customColorInput.value;
    }
  }
  
  if (!selectedColor) {
    console.log('[文体类型颜色] 没有选择颜色，取消操作');
    hideGenreColorDialog();
    return;
  }
  
  try {
    // 获取当前笔记ID
    const currentNoteId = window.currentNoteId;
    if (!currentNoteId) {
      console.error('[文体类型颜色] 没有当前笔记ID，无法应用颜色');
      hideGenreColorDialog();
      return;
    }
    
    // 获取笔记数据
    const note = await ipcRenderer.invoke('get-note', currentNoteId);
    if (!note) {
      console.error('[文体类型颜色] 获取笔记数据失败');
      hideGenreColorDialog();
      return;
    }
    
    // 更新元数据
    const updatedMetadata = note.metadata || {};
    updatedMetadata.genreColor = selectedColor;
    
    // 如果没有文体类型，尝试从标题中提取
    if (!updatedMetadata.genre && note.title && note.title.includes('  ')) {
      const parts = note.title.split('  ');
      if (parts.length > 1) {
        updatedMetadata.genre = parts[1];
        console.log(`[文体类型颜色] 从标题提取文体类型: ${updatedMetadata.genre}`);
      }
    }
    
    // 保存更新后的元数据
    await ipcRenderer.invoke('update-note-metadata', currentNoteId, updatedMetadata);
    console.log(`[文体类型颜色] 已保存文体类型颜色: ${selectedColor}`);
    
    // 更新UI中的文体类型颜色
    updateGenreColorInUI(currentNoteId, selectedColor);
    
    // 隐藏对话框
    hideGenreColorDialog();
  } catch (err) {
    console.error('[文体类型颜色] 应用颜色时出错:', err);
    hideGenreColorDialog();
  }
}

// 更新UI中的文体类型颜色
function updateGenreColorInUI(noteId, color) {
  console.log(`[文体类型颜色] 正在更新UI颜色为: ${color}`);
  
  // 更新编辑器中的文体类型标签
  const noteTitleElement = document.getElementById('note-title-display');
  if (noteTitleElement) {
    const genreBadge = noteTitleElement.querySelector('.genre-badge');
    if (genreBadge) {
      genreBadge.style.setProperty('--genre-color', color);
      genreBadge.style.color = color;
      console.log('[文体类型颜色] 已更新编辑器中的文体类型颜色');
    }
  }
  
  // 更新笔记列表中对应项的文体类型标签
  const noteItem = document.querySelector(`.note-item[data-id="${noteId}"]`);
  if (noteItem) {
    const titleElement = noteItem.querySelector('.note-title-text');
    if (titleElement) {
      const genreBadge = titleElement.querySelector('.genre-badge');
      if (genreBadge) {
        genreBadge.style.setProperty('--genre-color', color);
        genreBadge.style.color = color;
        console.log('[文体类型颜色] 已更新列表中的文体类型颜色');
      }
    }
  }
  
  // 触发自定义事件，通知其他组件
  document.dispatchEvent(new CustomEvent('genreColorUpdated', {
    detail: {
      noteId: noteId,
      genreColor: color
    }
  }));
}

// 添加CSS样式
function addGenreColorStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    /* 文体类型颜色按钮样式 */
    #genre-color-btn {
      margin-right: 4px;
    }
    
    /* 确保文体类型标签显示正确，使用艺术字体样式 */
    .genre-badge {
      display: inline-block;
      margin-left: 8px;
      font-size: 0.8em;
      font-style: italic;
      font-family: 'Kaiti', 'STKaiti', 'FangSong', 'STFangSong', cursive;
      font-weight: normal;
      opacity: 0.9;
      transition: color 0.2s ease, transform 0.2s ease;
      letter-spacing: 1px;
      text-shadow: 0px 0px 1px rgba(0,0,0,0.1);
      transform: scale(0.9);
      vertical-align: baseline;
      position: relative;
      top: -1px;
      border-left: 1px solid rgba(0,0,0,0.1);
      padding-left: 8px;
    }
    
    /* 确保在暗色主题下也能看清 */
    body.dark-theme .genre-badge {
      text-shadow: 0px 0px 1px rgba(255,255,255,0.2);
      border-left: 1px solid rgba(255,255,255,0.1);
    }
    
    /* 确保在对话框中颜色选项正确显示 */
    #genre-color-dialog .color-option {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      margin: 4px;
      cursor: pointer;
      display: inline-block;
      transition: transform 0.1s ease, box-shadow 0.1s ease;
    }
    
    #genre-color-dialog .color-option:hover {
      transform: scale(1.1);
    }
    
    #genre-color-dialog .color-option.selected {
      box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.8);
      transform: scale(1.1);
      z-index: 1;
    }
  `;
  
  document.head.appendChild(styleElement);
  console.log('[文体类型颜色] 已添加样式');
}

// 立即添加样式
addGenreColorStyles();

console.log('[文体类型颜色] 脚本加载完成'); 