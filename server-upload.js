// 服务器上传功能实现

// 获取DOM元素
const serverUploadBtn = document.getElementById('server-upload-btn');
const serverUploadDialog = document.getElementById('server-upload-dialog');
const uploadNotesList = document.getElementById('upload-notes-list');
const uploadCancelBtn = document.getElementById('upload-cancel-btn');
const uploadConfirmBtn = document.getElementById('upload-confirm-btn');
const serverConfigDialog = document.getElementById('server-config-dialog');
const serverUrlInput = document.getElementById('server-url-input');
const serverUsernameInput = document.getElementById('server-username-input');
const serverPasswordInput = document.getElementById('server-password-input');
const serverApiKeyInput = document.getElementById('server-api-key-input');
const serverHeadersInput = document.getElementById('server-headers-input');
const rememberServerToggle = document.getElementById('remember-server-toggle');
const serverConfigCancelBtn = document.getElementById('server-config-cancel-btn');
const serverConfigConfirmBtn = document.getElementById('server-config-confirm-btn');

// 服务器上传配置和状态
const serverUploadConfig = {
  // 已选择的笔记ID列表
  selectedNoteIds: [],
  // 保存的服务器配置
  savedConfig: null,
  // 上传状态
  status: {
    uploading: false,
    completed: 0,
    total: 0,
    success: 0,
    failed: 0,
    lastError: null
  },
  // 支持的上传协议
  supportedProtocols: ['http:', 'https:'],
  // 服务器响应超时时间(毫秒)
  timeout: 30000,
  // 重试配置
  retry: {
    maxAttempts: 3,
    delay: 1000
  }
};

// 在页面加载完成后添加自定义样式
document.addEventListener('DOMContentLoaded', () => {
  addServerUploadStyles();
  
  console.log('初始化服务器上传功能...');
  
  // 确保所有DOM元素都已加载
  if (!serverUploadBtn || !serverUploadDialog || !uploadNotesList || 
      !uploadCancelBtn || !uploadConfirmBtn || !serverConfigDialog) {
    console.error('服务器上传功能初始化失败: 部分DOM元素未找到');
    return;
  }
  
  // 绑定事件监听器
  serverUploadBtn.addEventListener('click', showServerUploadDialog);
  uploadCancelBtn.addEventListener('click', hideServerUploadDialog);
  uploadConfirmBtn.addEventListener('click', showServerConfigDialog);
  serverConfigCancelBtn.addEventListener('click', hideServerConfigDialog);
  serverConfigConfirmBtn.addEventListener('click', uploadToServer);
  
  // 为服务器URL输入框添加验证
  serverUrlInput.addEventListener('input', validateServerUrl);
  serverUrlInput.addEventListener('blur', validateServerUrl);
  
  // 添加服务器配置对话框的回车提交支持
  serverUrlInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
      uploadToServer();
    }
  });
  
  // 加载保存的服务器配置
  loadSavedServerConfig();
  
  console.log('服务器上传功能初始化完成');
});

// 添加服务器上传功能的自定义样式
function addServerUploadStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    /* 服务器上传对话框样式增强 */
    #server-upload-dialog .dialog-content,
    #server-config-dialog .dialog-content {
      max-width: 90vw;
      width: 500px;
    }
    
    /* 笔记列表容器样式 */
    .backup-notes-list {
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      margin-bottom: 15px;
      padding: 5px;
      background-color: var(--item-bg);
    }
    
    /* 选择控件 */
    .selection-controls {
      padding: 8px;
      margin-bottom: 8px;
      background-color: var(--card-bg);
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    
    /* 笔记计数器 */
    .note-counter {
      font-size: 12px;
      color: var(--text-color-secondary, #666);
      margin-bottom: 8px;
      padding: 0 8px;
    }
    
    /* 笔记容器 */
    .notes-container {
      padding: 0 5px;
    }
    
    /* 笔记项样式增强 */
    .backup-note-item {
      padding: 8px 10px;
      margin-bottom: 5px;
      background-color: var(--item-bg);
      border-radius: 4px;
      border-left: 2px solid var(--primary-color);
      transition: all 0.2s ease;
    }
    
    .backup-note-item:hover {
      background-color: var(--item-hover-bg);
      transform: translateX(2px);
    }
    
    .backup-note-item label {
      display: flex;
      align-items: center;
      width: 100%;
      cursor: pointer;
      margin: 0;
    }
    
    /* 切换图标 */
    .toggle-icon, .toggle-spacer {
      margin-right: 5px;
      width: 18px;
      display: inline-block;
      text-align: center;
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    
    .toggle-icon.collapsed {
      transform: rotate(-90deg);
    }
    
    /* 笔记图标 */
    .note-icon {
      margin-right: 5px;
      opacity: 0.7;
    }
    
    /* 笔记标题 */
    .note-title {
      flex: 1;
      margin-left: 5px;
      word-break: break-word;
    }
    
    /* 子笔记容器 */
    .subnotes-container {
      margin-left: 25px;
      transition: all 0.3s ease;
    }
    
    .subnotes-container.hidden {
      display: none;
    }
    
    /* 增加缩进 */
    .backup-subnote {
      margin-left: 0;
    }
    
    /* 日期样式 */
    .note-date {
      font-size: 11px;
      color: var(--text-color-secondary, #666);
      margin-left: 10px;
      white-space: nowrap;
    }
    
    /* 服务器配置对话框样式 */
    #server-url-input.invalid {
      border-color: #e74c3c;
      background-color: rgba(231, 76, 60, 0.05);
    }
    
    .selected-note-info {
      margin: 10px 0;
      padding: 8px;
      background-color: var(--item-bg);
      border-radius: 4px;
      text-align: center;
      font-weight: bold;
    }
    
    /* 上传进度容器 */
    .upload-progress-container {
      margin: 15px 0;
      padding: 10px;
      background-color: var(--item-bg);
      border-radius: 6px;
      border: 1px solid var(--border-color);
    }
    
    /* 上传进度条 */
    .upload-progress {
      height: 20px;
      background-color: #eee;
      border-radius: 10px;
      margin-bottom: 10px;
      overflow: hidden;
    }
    
    .upload-progress-bar {
      height: 100%;
      background-color: var(--primary-color);
      text-align: center;
      color: white;
      font-size: 12px;
      line-height: 20px;
      transition: width 0.3s ease;
    }
    
    /* 上传状态文本 */
    .upload-status {
      text-align: center;
      margin-bottom: 8px;
      font-weight: bold;
    }
    
    .upload-success {
      color: #2ecc71;
    }
    
    .upload-error {
      color: #e74c3c;
    }
    
    .upload-partial {
      color: #f39c12;
    }
    
    .upload-cancelled {
      color: #7f8c8d;
    }
    
    /* 详细状态 */
    .detailed-status {
      display: flex;
      justify-content: space-around;
      margin: 10px 0;
      padding: 5px;
      background-color: var(--card-bg);
      border-radius: 4px;
    }
    
    .status-item {
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 12px;
    }
    
    .status-item.success {
      background-color: rgba(46, 204, 113, 0.1);
      color: #2ecc71;
    }
    
    .status-item.failed {
      background-color: rgba(231, 76, 60, 0.1);
      color: #e74c3c;
    }
    
    .status-item.pending {
      background-color: rgba(243, 156, 18, 0.1);
      color: #f39c12;
    }
    
    /* 当前项目和错误消息 */
    .current-item {
      font-size: 12px;
      margin-top: 8px;
      color: var(--text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .error-message {
      font-size: 12px;
      margin-top: 5px;
      color: #e74c3c;
      background-color: rgba(231, 76, 60, 0.05);
      padding: 5px;
      border-radius: 3px;
      border-left: 2px solid #e74c3c;
      display: none;
    }
    
    /* 加载指示器 */
    .loading-indicator {
      text-align: center;
      padding: 20px;
      color: var(--text-color-secondary, #666);
    }
    
    /* 提示框样式增强 */
    .toast {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 3000;
      opacity: 0;
      transition: all 0.3s ease;
      max-width: 80%;
      text-align: center;
    }
    
    .toast.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }
    
    .toast.error {
      background-color: rgba(231, 76, 60, 0.9);
    }
    
    .toast.success {
      background-color: rgba(46, 204, 113, 0.9);
    }
    
    .toast.warning {
      background-color: rgba(243, 156, 18, 0.9);
    }
    
    .toast.info {
      background-color: rgba(52, 152, 219, 0.9);
    }
    
    /* 输入框样式增强 */
    #server-config-dialog input,
    #server-config-dialog textarea {
      transition: border-color 0.3s, background-color 0.3s;
    }
    
    #server-config-dialog input:focus,
    #server-config-dialog textarea:focus {
      border-color: var(--primary-color);
      outline: none;
    }
    
    /* 响应式调整 */
    @media (max-width: 600px) {
      #server-upload-dialog .dialog-content,
      #server-config-dialog .dialog-content {
        width: 95vw;
      }
      
      .backup-notes-list {
        max-height: 300px;
      }
      
      .note-date {
        display: none;
      }
    }
  `;
  
  document.head.appendChild(styleElement);
}

// 验证服务器URL
function validateServerUrl() {
  const url = serverUrlInput.value.trim();
  
  if (!url) {
    // 空值不显示错误
    serverUrlInput.classList.remove('invalid');
    return false;
  }
  
  try {
    const parsedUrl = new URL(url);
    const isValidProtocol = serverUploadConfig.supportedProtocols.includes(parsedUrl.protocol);
    
    if (!isValidProtocol) {
      serverUrlInput.classList.add('invalid');
      serverUrlInput.title = `不支持的协议: ${parsedUrl.protocol}，请使用 HTTP 或 HTTPS`;
      return false;
    }
    
    // 有效URL
    serverUrlInput.classList.remove('invalid');
    serverUrlInput.title = '';
    return true;
  } catch (error) {
    // 无效URL
    serverUrlInput.classList.add('invalid');
    serverUrlInput.title = '请输入有效的URL地址';
    return false;
  }
}

// 显示服务器上传对话框
function showServerUploadDialog() {
  console.log('打开服务器上传对话框');
  
  // 重置选择和状态
  serverUploadConfig.selectedNoteIds = [];
  resetUploadStatus();
  
  // 加载笔记列表
  loadNotesForUpload();
  
  // 显示对话框
  serverUploadDialog.classList.remove('hidden');
  
  // 添加点击空白区域关闭对话框
  serverUploadDialog.addEventListener('click', closeServerUploadDialogOnBlankClick);
}

// 重置上传状态
function resetUploadStatus() {
  serverUploadConfig.status = {
    uploading: false,
    completed: 0,
    total: 0,
    success: 0,
    failed: 0,
    lastError: null
  };
}

// 加载笔记列表供上传选择
async function loadNotesForUpload() {
  try {
    console.log('加载笔记列表...');
    
    // 显示加载中状态
    uploadNotesList.innerHTML = '<div class="loading-indicator">加载中...</div>';
    
    // 获取所有笔记
    const notes = await ipcRenderer.invoke('get-notes');
    
    // 清空列表
    uploadNotesList.innerHTML = '';
    
    if (!notes || notes.length === 0) {
      uploadNotesList.innerHTML = '<div class="empty-state">没有可上传的笔记</div>';
      return;
    }
    
    // 添加全选/取消全选控件
    const selectionControls = document.createElement('div');
    selectionControls.className = 'selection-controls';
    
    const selectAllLabel = document.createElement('label');
    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.id = 'select-all-notes';
    
    selectAllCheckbox.addEventListener('change', () => {
      const checkboxes = uploadNotesList.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        if (checkbox !== selectAllCheckbox) {
          checkbox.checked = selectAllCheckbox.checked;
          
          // 触发change事件使选择状态更新
          const event = new Event('change');
          checkbox.dispatchEvent(event);
        }
      });
    });
    
    selectAllLabel.appendChild(selectAllCheckbox);
    selectAllLabel.appendChild(document.createTextNode(' 全选/取消全选'));
    
    selectionControls.appendChild(selectAllLabel);
    uploadNotesList.appendChild(selectionControls);
    
    // 添加笔记计数指示器
    const noteCounter = document.createElement('div');
    noteCounter.className = 'note-counter';
    noteCounter.textContent = `总计 ${countTotalNotes(notes)} 个笔记（已选择：0）`;
    noteCounter.id = 'note-counter';
    uploadNotesList.appendChild(noteCounter);
    
    // 渲染笔记列表
    const notesContainer = document.createElement('div');
    notesContainer.className = 'notes-container';
    uploadNotesList.appendChild(notesContainer);
    
    notes.forEach(note => {
      renderUploadNoteItem(note, 0, notesContainer);
    });
    
    console.log(`已加载 ${countTotalNotes(notes)} 个笔记`);
  } catch (error) {
    console.error('加载笔记列表失败:', error);
    uploadNotesList.innerHTML = '<div class="empty-state error">加载笔记失败: ' + (error.message || '未知错误') + '</div>';
  }
}

// 计算笔记总数（包括子笔记）
function countTotalNotes(notes) {
  let count = 0;
  
  const countRecursive = (notesList) => {
    notesList.forEach(note => {
      count++;
      if (note.children && note.children.length > 0) {
        countRecursive(note.children);
      }
    });
  };
  
  countRecursive(notes);
  return count;
}

// 更新已选中笔记计数
function updateSelectedNoteCount() {
  const noteCounter = document.getElementById('note-counter');
  if (noteCounter) {
    // 提取总数
    const totalText = noteCounter.textContent.match(/总计 (\d+) 个笔记/);
    const total = totalText ? totalText[1] : '?';
    
    noteCounter.textContent = `总计 ${total} 个笔记（已选择：${serverUploadConfig.selectedNoteIds.length}）`;
  }
}

// 加载保存的服务器配置
function loadSavedServerConfig() {
  try {
    const savedConfig = localStorage.getItem('serverConfig');
    if (savedConfig) {
      serverUploadConfig.savedConfig = JSON.parse(savedConfig);
      console.log('已加载保存的服务器配置');
    }
  } catch (error) {
    console.error('加载服务器配置失败:', error);
  }
}

// 渲染上传笔记项
function renderUploadNoteItem(note, level, container) {
  // 创建笔记项容器
  const noteItem = document.createElement('div');
  noteItem.className = `backup-note-item ${level > 0 ? 'backup-subnote' : ''}`;
  noteItem.dataset.level = level;
  noteItem.dataset.id = note.id;
  
  // 创建标签和复选框
  const label = document.createElement('label');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.value = note.id;
  checkbox.dataset.title = note.title;
  
  // 添加选择事件处理
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      serverUploadConfig.selectedNoteIds.push(note.id);
    } else {
      serverUploadConfig.selectedNoteIds = serverUploadConfig.selectedNoteIds.filter(id => id !== note.id);
    }
    
    // 更新已选笔记计数
    updateSelectedNoteCount();
    
    // 更新全选状态
    updateSelectAllCheckbox();
  });
  
  // 添加展开/折叠图标（如果有子笔记）
  if (note.children && note.children.length > 0) {
    const toggleIcon = document.createElement('span');
    toggleIcon.className = 'toggle-icon expanded';
    toggleIcon.innerHTML = '▼';
    toggleIcon.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleSubnotes(toggleIcon, noteItem);
    });
    label.appendChild(toggleIcon);
  } else {
    // 添加占位，保持缩进一致
    const spacer = document.createElement('span');
    spacer.className = 'toggle-spacer';
    spacer.innerHTML = '&nbsp;&nbsp;';
    label.appendChild(spacer);
  }
  
  // 添加标题图标（根据笔记类型）
  const titleIcon = document.createElement('span');
  titleIcon.className = 'note-icon';
  titleIcon.innerHTML = note.type === 'outline' ? '📝' : '📄';
  label.appendChild(titleIcon);
  
  // 添加复选框
  label.appendChild(checkbox);
  
  // 添加标题（根据笔记层级使用不同样式）
  const titleSpan = document.createElement('span');
  titleSpan.className = 'note-title';
  titleSpan.textContent = note.title;
  
  // 如果有自定义颜色，应用到标题
  if (note.metadata && note.metadata.titleColor) {
    titleSpan.style.color = note.metadata.titleColor;
  }
  
  label.appendChild(titleSpan);
  
  // 添加更新日期（如果有）
  if (note.updated) {
    const dateSpan = document.createElement('span');
    dateSpan.className = 'note-date';
    dateSpan.textContent = `更新于: ${formatDate(note.updated)}`;
    label.appendChild(dateSpan);
  }
  
  // 将标签添加到笔记项
  noteItem.appendChild(label);
  
  // 将笔记项添加到容器
  container.appendChild(noteItem);
  
  // 为子笔记创建容器
  if (note.children && note.children.length > 0) {
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'subnotes-container';
    childrenContainer.dataset.parentId = note.id;
    
    // 递归渲染子笔记
    note.children.forEach(childNote => {
      renderUploadNoteItem(childNote, level + 1, childrenContainer);
    });
    
    // 将子笔记容器添加到列表
    container.appendChild(childrenContainer);
  }
}

// 格式化日期
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
}

// 数字补零
function padZero(num) {
  return num < 10 ? `0${num}` : num;
}

// 切换子笔记的显示/隐藏
function toggleSubnotes(toggleIcon, noteItem) {
  const noteId = noteItem.dataset.id;
  const container = document.querySelector(`.subnotes-container[data-parent-id="${noteId}"]`);
  
  if (container) {
    if (container.classList.contains('hidden')) {
      // 展开
      container.classList.remove('hidden');
      toggleIcon.innerHTML = '▼';
      toggleIcon.classList.remove('collapsed');
      toggleIcon.classList.add('expanded');
    } else {
      // 折叠
      container.classList.add('hidden');
      toggleIcon.innerHTML = '▶';
      toggleIcon.classList.remove('expanded');
      toggleIcon.classList.add('collapsed');
    }
  }
}

// 更新全选复选框状态
function updateSelectAllCheckbox() {
  const selectAllCheckbox = document.getElementById('select-all-notes');
  const checkboxes = uploadNotesList.querySelectorAll('input[type="checkbox"]:not(#select-all-notes)');
  
  if (!selectAllCheckbox || checkboxes.length === 0) return;
  
  const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
  
  if (checkedCount === 0) {
    // 没有选中的
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  } else if (checkedCount === checkboxes.length) {
    // 全部选中
    selectAllCheckbox.checked = true;
    selectAllCheckbox.indeterminate = false;
  } else {
    // 部分选中
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = true;
  }
}

// 隐藏服务器上传对话框
function hideServerUploadDialog() {
  serverUploadDialog.classList.add('hidden');
  serverUploadDialog.removeEventListener('click', closeServerUploadDialogOnBlankClick);
}

// 点击空白区域关闭对话框
function closeServerUploadDialogOnBlankClick(event) {
  if (event.target === serverUploadDialog) {
    hideServerUploadDialog();
  }
}

// 显示服务器配置对话框
function showServerConfigDialog() {
  if (serverUploadConfig.selectedNoteIds.length === 0) {
    showToast('请至少选择一个笔记进行上传', 'warning');
    return;
  }
  
  // 隐藏上传笔记对话框
  hideServerUploadDialog();
  
  // 清除任何先前上传的进度条
  removeExistingProgressBar();
  
  // 填充已保存的服务器配置
  if (serverUploadConfig.savedConfig) {
    serverUrlInput.value = serverUploadConfig.savedConfig.url || '';
    serverUsernameInput.value = serverUploadConfig.savedConfig.username || '';
    serverPasswordInput.value = serverUploadConfig.savedConfig.password || '';
    serverApiKeyInput.value = serverUploadConfig.savedConfig.apiKey || '';
    serverHeadersInput.value = serverUploadConfig.savedConfig.headers || '';
    rememberServerToggle.checked = true;
  }
  
  // 显示选中的笔记数量
  const selectedCount = document.createElement('div');
  selectedCount.className = 'selected-note-info';
  selectedCount.textContent = `已选择 ${serverUploadConfig.selectedNoteIds.length} 个笔记准备上传`;
  
  const dialogContent = serverConfigDialog.querySelector('.dialog-content');
  const dialogButtons = dialogContent.querySelector('.dialog-buttons');
  
  // 添加选中笔记提示到按钮上方
  dialogContent.insertBefore(selectedCount, dialogButtons);
  
  // 显示服务器配置对话框
  serverConfigDialog.classList.remove('hidden');
  
  // 添加点击空白区域关闭对话框
  serverConfigDialog.addEventListener('click', closeServerConfigDialogOnBlankClick);
  
  // 验证服务器URL
  validateServerUrl();
}

// 移除已存在的进度条
function removeExistingProgressBar() {
  const existingProgress = serverConfigDialog.querySelector('.upload-progress-container');
  if (existingProgress) {
    existingProgress.remove();
  }
  
  const existingInfo = serverConfigDialog.querySelector('.selected-note-info');
  if (existingInfo) {
    existingInfo.remove();
  }
}

// 隐藏服务器配置对话框
function hideServerConfigDialog() {
  serverConfigDialog.classList.add('hidden');
  serverConfigDialog.removeEventListener('click', closeServerConfigDialogOnBlankClick);
  
  // 重置UI状态
  serverConfigConfirmBtn.disabled = false;
  serverConfigCancelBtn.disabled = false;
  serverConfigConfirmBtn.textContent = '上传';
  serverConfigCancelBtn.textContent = '取消';
}

// 点击空白区域关闭对话框
function closeServerConfigDialogOnBlankClick(event) {
  if (event.target === serverConfigDialog) {
    // 如果正在上传，不允许关闭
    if (serverUploadConfig.status.uploading) {
      showToast('上传正在进行中，请等待完成', 'info');
      return;
    }
    hideServerConfigDialog();
  }
}

// 保存服务器配置
function saveServerConfig(config) {
  try {
    localStorage.setItem('serverConfig', JSON.stringify(config));
    serverUploadConfig.savedConfig = config;
    console.log('服务器配置已保存');
  } catch (error) {
    console.error('保存服务器配置失败:', error);
    showToast('保存服务器配置失败', 'error');
  }
}

// 上传到服务器
async function uploadToServer() {
  // 如果已经在上传中，不允许重复操作
  if (serverUploadConfig.status.uploading) {
    showToast('上传已经在进行中', 'info');
    return;
  }
  
  try {
    // 验证服务器URL
    const serverUrl = serverUrlInput.value.trim();
    if (!serverUrl || !validateServerUrl()) {
      showToast('请输入有效的服务器地址', 'error');
      serverUrlInput.focus();
      return;
    }
    
    // 准备服务器配置
    const serverConfig = {
      url: serverUrl,
      username: serverUsernameInput.value.trim(),
      password: serverPasswordInput.value,
      apiKey: serverApiKeyInput.value.trim(),
      headers: serverHeadersInput.value.trim()
    };
    
    // 记住服务器配置
    if (rememberServerToggle.checked) {
      saveServerConfig(serverConfig);
    }
    
    // 移除已存在的进度显示
    removeExistingProgressBar();
    
    // 创建上传进度元素
    const progressContainer = document.createElement('div');
    progressContainer.className = 'upload-progress-container';
    progressContainer.innerHTML = `
      <div class="upload-progress">
        <div class="upload-progress-bar" id="upload-progress-bar">0%</div>
      </div>
      <div class="upload-status" id="upload-status">准备上传...</div>
      <div class="detailed-status">
        <span class="status-item success">成功: <span id="success-count">0</span></span>
        <span class="status-item failed">失败: <span id="failed-count">0</span></span>
        <span class="status-item pending">待处理: <span id="pending-count">${serverUploadConfig.selectedNoteIds.length}</span></span>
      </div>
      <div class="current-item" id="current-item"></div>
      <div class="error-message" id="error-message"></div>
    `;
    
    // 添加到对话框内容中
    const dialogContent = serverConfigDialog.querySelector('.dialog-content');
    const dialogButtons = dialogContent.querySelector('.dialog-buttons');
    dialogContent.insertBefore(progressContainer, dialogButtons);
    
    // 禁用上传按钮
    serverConfigConfirmBtn.disabled = true;
    serverConfigCancelBtn.disabled = true;
    
    // 获取进度显示元素
    const progressBar = document.getElementById('upload-progress-bar');
    const statusText = document.getElementById('upload-status');
    const successCount = document.getElementById('success-count');
    const failedCount = document.getElementById('failed-count');
    const pendingCount = document.getElementById('pending-count');
    const currentItem = document.getElementById('current-item');
    const errorMessage = document.getElementById('error-message');
    
    // 设置上传状态
    serverUploadConfig.status.uploading = true;
    serverUploadConfig.status.total = serverUploadConfig.selectedNoteIds.length;
    serverUploadConfig.status.completed = 0;
    serverUploadConfig.status.success = 0;
    serverUploadConfig.status.failed = 0;
    
    try {
      // 获取所有笔记
      const allNotes = await ipcRenderer.invoke('get-notes');
      
      // 筛选出选定的笔记
      const uploadNotes = [];
      
      // 递归查找选定的笔记
      const findSelectedNotes = (notesList) => {
        for (const note of notesList) {
          if (serverUploadConfig.selectedNoteIds.includes(note.id)) {
            uploadNotes.push(note);
          }
          
          if (note.children && note.children.length > 0) {
            findSelectedNotes(note.children);
          }
        }
      };
      
      findSelectedNotes(allNotes);
      
      // 更新状态
      statusText.textContent = `正在上传 ${uploadNotes.length} 个笔记...`;
      
      // 调用主进程进行上传前准备
      const prepareResult = await ipcRenderer.invoke('upload-to-server', {
        notes: uploadNotes.map(n => n.id),
        serverConfig: serverConfig
      });
      
      if (prepareResult.success) {
        // 记录开始时间
        const startTime = Date.now();
        
        // 创建取消按钮功能
        serverConfigCancelBtn.disabled = false;
        serverConfigCancelBtn.textContent = '取消上传';
        
        // 取消按钮临时改为取消上传功能
        const originalClickHandler = serverConfigCancelBtn.onclick;
        serverConfigCancelBtn.onclick = () => {
          if (confirm('确定要取消上传吗？已上传的内容不会被撤销。')) {
            serverUploadConfig.status.uploading = false;
            statusText.textContent = '上传已取消';
            statusText.className = 'upload-status upload-cancelled';
            
            // 恢复按钮功能
            serverConfigCancelBtn.textContent = '关闭';
            serverConfigCancelBtn.onclick = originalClickHandler;
            serverConfigConfirmBtn.disabled = false;
          }
        };
        
        // 使用批量上传方式处理大量笔记
        const batchSize = 5; // 每批处理的笔记数
        const batches = [];
        
        // 分批处理
        for (let i = 0; i < uploadNotes.length; i += batchSize) {
          batches.push(uploadNotes.slice(i, i + batchSize));
        }
        
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex];
          
          // 如果上传被取消，停止处理
          if (!serverUploadConfig.status.uploading) break;
          
          // 并行上传当前批次
          const batchPromises = batch.map(note => uploadSingleNote(note, serverConfig, currentItem));
          const batchResults = await Promise.allSettled(batchPromises);
          
          // 处理结果
          batchResults.forEach((result, index) => {
            const note = batch[index];
            
            if (result.status === 'fulfilled' && result.value.success) {
              serverUploadConfig.status.success++;
            } else {
              serverUploadConfig.status.failed++;
              console.error(`上传笔记 ${note.title} 失败:`, 
                result.reason || (result.value && result.value.error) || '未知错误');
                
              // 显示最后一个错误信息
              const error = result.reason || (result.value && result.value.error);
              if (error) {
                serverUploadConfig.status.lastError = error;
                errorMessage.textContent = `最近错误: ${error.message || error}`;
                errorMessage.style.display = 'block';
              }
            }
            
            // 更新已完成数量
            serverUploadConfig.status.completed++;
            
            // 更新UI
            updateUploadProgress(progressBar, statusText, successCount, failedCount, pendingCount);
          });
        }
        
        // 计算上传总耗时
        const totalTime = (Date.now() - startTime) / 1000;
        
        // 上传完成
        currentItem.textContent = '';
        
        if (serverUploadConfig.status.uploading) {
          // 正常完成
          const summaryMessage = `上传完成 - 成功: ${serverUploadConfig.status.success}, 失败: ${serverUploadConfig.status.failed}, 总耗时: ${totalTime.toFixed(1)}秒`;
          statusText.textContent = summaryMessage;
          
          if (serverUploadConfig.status.failed > 0) {
            statusText.className = 'upload-status upload-partial';
          } else {
            statusText.className = 'upload-status upload-success';
          }
        }
        
        // 恢复按钮功能
        serverConfigCancelBtn.disabled = false;
        serverConfigCancelBtn.textContent = '关闭';
        serverConfigCancelBtn.onclick = originalClickHandler;
      } else {
        // 上传准备失败
        statusText.textContent = `上传准备失败: ${prepareResult.error || '未知错误'}`;
        statusText.className = 'upload-status upload-error';
        errorMessage.textContent = prepareResult.error || '未知错误';
        errorMessage.style.display = 'block';
        
        // 启用所有按钮
        serverConfigCancelBtn.disabled = false;
        serverConfigConfirmBtn.disabled = false;
      }
    } catch (error) {
      console.error('上传笔记失败:', error);
      statusText.textContent = `上传失败: ${error.message || '未知错误'}`;
      statusText.className = 'upload-status upload-error';
      errorMessage.textContent = error.message || '未知错误';
      errorMessage.style.display = 'block';
      
      // 启用所有按钮
      serverConfigCancelBtn.disabled = false;
      serverConfigConfirmBtn.disabled = false;
    } finally {
      // 设置上传状态为完成
      serverUploadConfig.status.uploading = false;
    }
  } catch (error) {
    console.error('上传到服务器失败:', error);
    showToast(`上传失败: ${error.message || '未知错误'}`, 'error');
    
    // 恢复按钮状态
    serverConfigConfirmBtn.disabled = false;
    serverConfigCancelBtn.disabled = false;
    
    // 设置上传状态为完成
    serverUploadConfig.status.uploading = false;
  }
}

// 更新上传进度显示
function updateUploadProgress(progressBar, statusText, successCount, failedCount, pendingCount) {
  const { completed, total, success, failed } = serverUploadConfig.status;
  
  // 更新进度条
  const progress = Math.round((completed / total) * 100);
  progressBar.style.width = `${progress}%`;
  progressBar.textContent = `${progress}%`;
  
  // 更新状态文本
  if (serverUploadConfig.status.uploading) {
    statusText.textContent = `上传中... ${completed}/${total}`;
  }
  
  // 更新详细计数
  successCount.textContent = success;
  failedCount.textContent = failed;
  pendingCount.textContent = total - completed;
}

// 上传单个笔记
async function uploadSingleNote(note, serverConfig, currentItemElement) {
  // 如果上传已取消，立即返回
  if (!serverUploadConfig.status.uploading) {
    return { success: false, cancelled: true };
  }
  
  try {
    // 显示当前处理的笔记
    if (currentItemElement) {
      currentItemElement.textContent = `正在上传: ${note.title}`;
    }
    
    // 获取笔记内容
    const noteData = await ipcRenderer.invoke('get-note', note.id);
    
    // 提取内容文本（去除HTML标签）
    const contentText = noteData.content ? stripHtml(noteData.content) : '';
    
    // 构建上传的数据
    const uploadData = {
      id: note.id,
      title: note.title,
      content: noteData.content || '',
      plainText: contentText,
      created: note.created,
      updated: note.updated || note.created,
      type: note.type,
      level: note.level || 1,
      metadata: note.metadata || {}
    };
    
    // 添加统计信息
    if (contentText) {
      uploadData.stats = {
        charCount: contentText.length,
        wordCount: estimateWordCount(contentText)
      };
    }
    
    // 使用带重试的上传方法
    return await uploadWithRetry(serverConfig.url, uploadData, serverConfig);
  } catch (error) {
    console.error(`上传笔记 ${note.title} 失败:`, error);
    return { 
      success: false, 
      error: error,
      noteId: note.id,
      noteTitle: note.title
    };
  }
}

// 带重试逻辑的上传函数
async function uploadWithRetry(serverUrl, data, serverConfig) {
  const { maxAttempts, delay } = serverUploadConfig.retry;
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // 如果上传已取消，立即返回
      if (!serverUploadConfig.status.uploading) {
        return { success: false, cancelled: true };
      }
      
      // 添加重试信息
      if (attempt > 1) {
        console.log(`重试上传笔记 ${data.title} (尝试 ${attempt}/${maxAttempts})`);
      }
      
      // 发送请求到服务器
      const response = await Promise.race([
        fetch(serverUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(serverConfig.apiKey ? { 'Authorization': `Bearer ${serverConfig.apiKey}` } : {}),
            ...(parseCustomHeaders(serverConfig.headers))
          },
          body: JSON.stringify(data),
          credentials: serverConfig.username && serverConfig.password ? 'include' : 'same-origin'
        }),
        // 添加超时处理
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('请求超时')), serverUploadConfig.timeout)
        )
      ]);
      
      // 检查响应
      if (!response.ok) {
        throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
      }
      
      // 尝试解析响应
      try {
        const responseData = await response.json();
        return { 
          success: true, 
          data: responseData,
          noteId: data.id,
          noteTitle: data.title
        };
      } catch (jsonError) {
        // 如果无法解析JSON但响应成功，仍然视为成功
        return { 
          success: true,
          noteId: data.id,
          noteTitle: data.title
        };
      }
    } catch (error) {
      lastError = error;
      
      // 如果不是最后一次尝试，等待后重试
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // 所有重试都失败
  return { 
    success: false, 
    error: lastError,
    noteId: data.id,
    noteTitle: data.title,
    attempts: maxAttempts
  };
}

// 解析自定义请求头
function parseCustomHeaders(headersText) {
  if (!headersText) return {};
  
  const headers = {};
  const lines = headersText.split('\n');
  
  for (const line of lines) {
    const parts = line.split(':');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join(':').trim();
      if (key && value) {
        headers[key] = value;
      }
    }
  }
  
  return headers;
}

// 从HTML中提取纯文本
function stripHtml(html) {
  if (!html) return '';
  
  // 创建临时DOM元素
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // 获取文本内容
  return temp.textContent || temp.innerText || '';
}

// 估算词数（简单实现）
function estimateWordCount(text) {
  if (!text) return 0;
  
  // 中文每个字符算一个词
  const chineseCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  
  // 英文和数字按空格分隔计算
  const nonChineseText = text.replace(/[\u4e00-\u9fa5]/g, '');
  const nonChineseWords = nonChineseText.split(/\s+/).filter(word => word.length > 0).length;
  
  return chineseCount + nonChineseWords;
}

// 显示提示消息
function showToast(message, type = 'info', duration = 3000) {
  // 检查是否已有toast
  let toast = document.querySelector('.toast');
  
  if (!toast) {
    // 创建新的toast
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  
  // 设置消息类型样式
  toast.className = `toast ${type}`;
  
  // 设置消息
  toast.textContent = message;
  
  // 显示toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // 定时关闭
  setTimeout(() => {
    toast.classList.remove('show');
    
    // 移除元素
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
} 