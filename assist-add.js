document.addEventListener('DOMContentLoaded', () => {
  // 文体类型数据
  const literaryGenres = [
    { name: '诏', type: 'official' },
    { name: '檄', type: 'official' },
    { name: '奏', type: 'official' },
    { name: '策', type: 'argument' },
    { name: '论', type: 'argument' },
    { name: '辩', type: 'argument' },
    { name: '解', type: 'narrative' },
    { name: '传', type: 'narrative' },
    { name: '状', type: 'official' },
    { name: '志', type: 'narrative' },
    { name: '赋', type: 'lyric' },
    { name: '哀', type: 'lyric' },
    { name: '诔', type: 'ritual' },
    { name: '碑', type: 'certificate' },
    { name: '箴', type: 'argument' },
    { name: '赞', type: 'lyric' },
    { name: '判', type: 'official' },
    { name: '帖', type: 'certificate' },
    { name: '祝', type: 'ritual' },
    { name: '盟', type: 'certificate' },
    { name: '颂', type: 'lyric' },
    { name: '连珠', type: 'creative' },
    { name: '九锡文', type: 'ritual' },
    { name: '青词', type: 'ritual' },
    { name: '揭帖', type: 'certificate' },
    { name: '表', type: 'official' },
    { name: '移', type: 'official' },
    { name: '书', type: 'official' },
    { name: '启', type: 'official' },
    { name: '笺', type: 'official' },
    { name: '跋', type: 'certificate' },
    { name: '序', type: 'narrative' },
    { name: '史传', type: 'narrative' },
    { name: '行状', type: 'narrative' },
    { name: '碑志', type: 'certificate' },
    { name: '契约', type: 'certificate' },
    { name: '判词', type: 'official' },
    { name: '药方', type: 'creative' },
    { name: '谜赋', type: 'creative' },
    { name: '药方体', type: 'creative' },
    { name: '酒令', type: 'creative' },
    { name: '阄书', type: 'creative' }
  ];
  
  const { ipcRenderer } = require('electron');
  
  // 获取DOM元素
  const assistAddToggle = document.getElementById('assist-add-toggle');
  const assistButtonsContainer = document.getElementById('assist-buttons');
  const addNoteDialog = document.getElementById('add-note-dialog');
  const addDialogTitle = document.getElementById('add-dialog-title');
  const noteTitleInput = document.getElementById('note-title-input');
  const confirmBtn = document.getElementById('confirm-btn');
  const toggleAssistButtonsBtn = document.getElementById('toggle-assist-buttons');
  
  // 如果元素不存在，直接返回
  if (!assistAddToggle || !assistButtonsContainer) return;
  
  // 初始化文体类型展开/收纳状态
  let isAssistButtonsExpanded = true;
  
  // 处理收纳/展开按钮点击事件
  if (toggleAssistButtonsBtn) {
    toggleAssistButtonsBtn.addEventListener('click', () => {
      if (isAssistButtonsExpanded) {
        // 收纳文体类型
        assistButtonsContainer.classList.add('collapsed');
        toggleAssistButtonsBtn.title = "展开文体类型";
        toggleAssistButtonsBtn.textContent = "展开";
      } else {
        // 展开文体类型
        assistButtonsContainer.classList.remove('collapsed');
        toggleAssistButtonsBtn.title = "收起文体类型";
        toggleAssistButtonsBtn.textContent = "收起";
      }
      isAssistButtonsExpanded = !isAssistButtonsExpanded;
      
      // 保存当前展开/收起状态到本地存储
      localStorage.setItem('assistButtonsExpanded', isAssistButtonsExpanded ? '1' : '0');
    });
    
    // 初始化按钮文本
    toggleAssistButtonsBtn.textContent = "收起";
  }
  
  // 添加鼠标滚轮控制横向滚动功能
  if (assistButtonsContainer) {
    assistButtonsContainer.addEventListener('wheel', (event) => {
      event.preventDefault();
      
      // 滚轮向下滚动时，内容向左滚动
      // 滚轮向上滚动时，内容向右滚动
      assistButtonsContainer.scrollLeft += event.deltaY > 0 ? 40 : -40;
    });
  }
  
  // 修改renderNote函数，添加对文体类型的显示支持
  let originalRenderNote = window.renderNote;
  const setupRenderNote = () => {
    if (typeof window.renderNote === 'function') {
      originalRenderNote = window.renderNote;
      
      // 由于标题已经包含文体类型，不再需要额外的标记
      // 直接使用原始renderNote函数
      console.log('标题已包含文体类型，不需要额外标记');
      return true;
    }
    return false;
  };
  
  // 尝试设置renderNote
  if (!setupRenderNote()) {
    // 如果renderNote还不可用，设置一个监听器等待它变为可用
    console.log('renderNote函数尚未可用，等待它变为可用...');
    
    // 创建一个MutationObserver来监听DOM更改
    const observer = new MutationObserver(() => {
      if (typeof window.renderNote === 'function' && window.renderNote !== originalRenderNote) {
        setupRenderNote();
        observer.disconnect();
      }
    });
    
    // 开始观察document的变化
    observer.observe(document, { childList: true, subtree: true });
    
    // 设置一个超时，如果5秒后renderNote仍然不可用，则放弃
    setTimeout(() => {
      if (!setupRenderNote()) {
        console.error('renderNote函数在5秒后仍然不可用，无法添加文体类型显示支持');
      }
      observer.disconnect();
    }, 5000);
  }
  
  // 显示文体快捷按钮
  function showAssistButtons() {
    // 清空容器
    assistButtonsContainer.innerHTML = '';
    
    // 创建文体按钮
    literaryGenres.forEach(genre => {
      const button = document.createElement('button');
      button.className = `assist-button type-${genre.type}`;
      button.textContent = genre.name;
      button.dataset.genre = genre.name;
      button.title = `创建${genre.name}类型的笔记`;
      
      // 添加点击事件
      button.addEventListener('click', () => {
        // 显示添加笔记对话框
        addDialogTitle.textContent = `添加${genre.name}笔记`;
        noteTitleInput.value = ''; // 清空输入框
        noteTitleInput.placeholder = `请输入${genre.name}笔记标题`;
        noteTitleInput.dataset.genre = genre.name; // 保存文体类型
        
        // 显示对话框
        addNoteDialog.classList.remove('hidden');
        noteTitleInput.focus();
      });
      
      assistButtonsContainer.appendChild(button);
    });
    
    // 显示容器
    assistButtonsContainer.classList.remove('hidden');
    
    // 恢复上次的展开/收起状态
    const savedState = localStorage.getItem('assistButtonsExpanded');
    if (savedState === '0') {
      assistButtonsContainer.classList.add('collapsed');
      if (toggleAssistButtonsBtn) {
        toggleAssistButtonsBtn.title = "展开文体类型";
        toggleAssistButtonsBtn.textContent = "展开";
      }
      isAssistButtonsExpanded = false;
    } else {
      // 默认展开
      assistButtonsContainer.classList.remove('collapsed');
      if (toggleAssistButtonsBtn) {
        toggleAssistButtonsBtn.title = "收起文体类型";
        toggleAssistButtonsBtn.textContent = "收起";
      }
      isAssistButtonsExpanded = true;
    }
  }
  
  // 隐藏文体快捷按钮
  function hideAssistButtons() {
    assistButtonsContainer.classList.add('hidden');
    if (toggleAssistButtonsBtn) {
      toggleAssistButtonsBtn.parentElement.classList.add('hidden');
    }
  }
  
  // 切换辅助添加功能
  async function toggleAssistAdd() {
    // 获取当前设置
    let settings = await ipcRenderer.invoke('get-settings');
    
    // 更新设置
    settings.assistAdd = assistAddToggle.checked;
    
    // 保存设置
    await ipcRenderer.invoke('update-settings', settings);
    
    // 更新UI
    if (settings.assistAdd) {
      showAssistButtons();
      if (toggleAssistButtonsBtn) {
        toggleAssistButtonsBtn.parentElement.classList.remove('hidden');
      }
    } else {
      hideAssistButtons();
    }
  }
  
  // 初始化辅助添加功能
  async function initAssistAdd() {
    // 获取当前设置
    let settings = await ipcRenderer.invoke('get-settings');
    
    // 设置切换开关状态
    assistAddToggle.checked = settings.assistAdd || false;
    
    // 根据设置显示或隐藏辅助添加按钮
    if (settings.assistAdd) {
      showAssistButtons();
      if (toggleAssistButtonsBtn) {
        toggleAssistButtonsBtn.parentElement.classList.remove('hidden');
      }
    } else {
      hideAssistButtons();
    }
    
    // 添加切换事件
    assistAddToggle.addEventListener('change', toggleAssistAdd);
  }
  
  // 初始化功能
  initAssistAdd();
  
  // 添加确认添加笔记处理
  const originalHandleConfirmAdd = window.handleConfirmAdd;
  if (typeof originalHandleConfirmAdd === 'function') {
    window.handleConfirmAdd = async function() {
      const title = noteTitleInput.value.trim();
      if (!title) return;
      
      // 获取文体类型（如果有）
      const genre = noteTitleInput.dataset.genre || null;
      
      // 格式化标题：将标题改为"标题  文本类型"的格式（标题后面有两个空格）
      let formattedTitle = title;
      if (genre) {
        formattedTitle = `${title}  ${genre}`;
      }
      
      // 隐藏对话框
      window.hideAddNoteDialog();
      
      try {
        // 显式检查全局变量，确保访问window上的属性
        const isSubnote = window.isAddingSubnote === true;
        const selectedId = window.selectedOutlineId;
        const selectedLevel = window.selectedNoteLevel || 1;
        
        console.log(`添加笔记: 标题=${formattedTitle}, 作为子笔记=${isSubnote}, 父ID=${selectedId}, 父级层级=${selectedLevel}`);
        
        if (isSubnote && selectedId) {
          // 添加子笔记
          const result = await ipcRenderer.invoke('add-subnote', selectedId, formattedTitle);
          
          if (result && result.error) {
            window.showToast(result.error);
            return;
          }
          
          // 设置文体类型
          if (genre && result && result.id) {
            await ipcRenderer.invoke('update-note-metadata', result.id, { genre });
          }
          
          // 重新加载笔记列表
          await window.loadNotes();
          if (result && result.id) {
            window.openNote(result.id);
          }
          
          // 显示成功提示
          const newLevel = selectedLevel + 1;
          window.showToast(`成功添加"${title}"(${newLevel}级)`);
        } else {
          // 添加顶层笔记
          const newOutline = await ipcRenderer.invoke('add-outline', formattedTitle);
          
          // 设置文体类型
          if (genre && newOutline && newOutline.id) {
            await ipcRenderer.invoke('update-note-metadata', newOutline.id, { genre });
          }
          
          // 重新加载笔记列表
          await window.loadNotes();
          if (newOutline && newOutline.id) {
            window.openNote(newOutline.id);
          }
          
          // 显示成功提示
          window.showToast(`成功添加"${title}"(1级)`);
        }
      } catch (error) {
        console.error('添加笔记失败:', error);
        window.showToast('添加笔记失败: ' + error.message);
      }
    };
  }
}); 