const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// 初始化数据存储
const store = new Store({
  name: 'xiaojishi-data',
  defaults: {
    notes: [],
    settings: {
      theme: 'light',
      foldTitles: false, // 添加折叠标题选项
      opacity: 100, // 添加透明度选项
      backups: [], // 用于存储备份配置
      maxChildren: 0, // 添加子级数量限制
      maxLevel: 5, // 添加最大层级限制
      assistAdd: false // 添加辅助添加设置
    }
  }
});

// 初始化文件存储目录
function initializeStorageDirectory() {
  const userDataPath = app.getPath('userData');
  // 将笔记存储在handwriting-book\笔目录下
  const notesDir = path.join(userDataPath, 'handwriting-book', '笔');
  
  if (!fs.existsSync(notesDir)) {
    fs.mkdirSync(notesDir, { recursive: true });
  }
  
  // 创建APP目录下的备份目录
  const appDir = path.join(process.cwd(), 'APP', 'handwriting-book', '笔');
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
  }
  
  // 创建APP目录的父目录（便于访问）
  const memoryArchiveDir = path.join(process.cwd(), 'APP', 'handwriting-book');
  if (!fs.existsSync(memoryArchiveDir)) {
    fs.mkdirSync(memoryArchiveDir, { recursive: true });
  }
  
  return {
    userDir: notesDir,
    appDir: appDir,
    memoryArchiveDir: memoryArchiveDir
  };
}

const dirs = initializeStorageDirectory();
const notesDir = dirs.userDir;
const appBackupDir = dirs.appDir;

let mainWindow;

function createWindow() {
  // 获取保存的透明度设置
  const settings = store.get('settings');
  const opacity = settings.opacity ? settings.opacity / 100 : 1;
  
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    title: '小记事 v1.0.0',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, '29-ico.ico'),
    frame: false, // 移除系统标题栏
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    backgroundColor: '#00FFFFFF', // 允许透明
    opacity: opacity
  });

  mainWindow.loadFile('index.html');
  
  // 设置空菜单，移除默认菜单栏
  Menu.setApplicationMenu(null);
  
  // 在开发环境打开开发者工具
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  // 设置任务栏图标
  if (process.platform === 'win32') {
    mainWindow.setThumbarButtons([]);
    mainWindow.setIcon(path.join(__dirname, '29-ico.ico'));
    app.setAppUserModelId(process.execPath);
  }

  // 监听文件拖拽结束，尝试保存真实文件
  ipcMain.on('drag-finished', (event, data) => {
    if (data && data.tempFilePath) {
      // 尝试将临时文件持久化到合适位置
      try {
        // 复制到真实位置的操作可以在这里添加
        console.log('拖拽结束，临时文件路径:', data.tempFilePath);
      } catch (error) {
        console.error('处理拖拽结束事件失败:', error);
      }
    }
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// 处理窗口透明度
ipcMain.handle('window-opacity', (event, opacity) => {
  if (mainWindow) {
    mainWindow.setOpacity(opacity);
  }
  return true;
});

// 处理窗口控制命令
ipcMain.handle('window-control', (event, command) => {
  switch (command) {
    case 'minimize':
      mainWindow.minimize();
      break;
    case 'maximize':
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
      break;
    case 'close':
      mainWindow.close();
      break;
  }
  return true;
});

// 获取应用设置
ipcMain.handle('get-settings', () => {
  return store.get('settings');
});

// 更新应用设置
ipcMain.handle('update-settings', (event, settings) => {
  store.set('settings', settings);
  return true;
});

// 获取所有笔记
ipcMain.handle('get-notes', () => {
  return store.get('notes');
});

// 添加大纲标题
ipcMain.handle('add-outline', (event, title) => {
  const notes = store.get('notes');
  const newOutline = {
    id: uuidv4(),
    title: title,
    content: '',
    created: Date.now(),
    type: 'outline',
    children: [],
    level: 1 // 顶层标题，级别为1
  };
  
  // 使用标题作为文件名（过滤掉不合法的字符）
  const sanitizedTitle = title.replace(/[\\/:*?"<>|]/g, '_');
  const fileName = `${sanitizedTitle}.txt`;
  const filePath = path.join(notesDir, fileName);
  
  // 如果文件已存在，添加时间戳区分
  let finalFilePath = filePath;
  if (fs.existsSync(filePath)) {
    const timestamp = Date.now();
    finalFilePath = path.join(notesDir, `${sanitizedTitle}_${timestamp}.txt`);
  }
  
  // 保存文件路径到笔记对象中
  newOutline.filePath = path.basename(finalFilePath);
  
  // 写入文件到用户目录
  fs.writeFileSync(finalFilePath, '', 'utf8');
  
  // 同时写入到APP目录
  const appFilePath = path.join(appBackupDir, path.basename(finalFilePath));
  fs.writeFileSync(appFilePath, '', 'utf8');
  
  notes.push(newOutline);
  store.set('notes', notes);
  return newOutline;
});

// 添加子笔记
ipcMain.handle('add-subnote', (event, parentId, title) => {
  const notes = store.get('notes');
  const settings = store.get('settings') || {}; // 获取设置
  
  // 查找父笔记和父笔记的路径
  let parent = null;
  let parentPath = [];
  let parentLevel = 0;
  
  console.log(`添加子笔记: 父ID=${parentId}, 标题=${title}`);
  
  // 首先检查是否为顶层大纲的子笔记
  const outlineIndex = notes.findIndex(note => note.id === parentId);
  if (outlineIndex !== -1) {
    parent = notes[outlineIndex];
    parentPath = [parent.title];
    // 确保父级层级是正确的数字
    parentLevel = parent.level || 1;
    
    console.log(`找到顶层父笔记: ${parent.title}, 层级=${parentLevel}`);
    
    // 检查子级数量是否超过限制
    if (settings.maxChildren > 0 && parent.children && parent.children.length >= settings.maxChildren) {
      return { error: `超过最大子级数量限制(${settings.maxChildren}个)` };
    }
  } else {
    // 如果不是，则递归查找多层嵌套的子笔记
    const findParent = (notesList) => {
      for (const note of notesList) {
        if (note.children && note.children.length > 0) {
          // 检查当前笔记的子笔记
          const childIndex = note.children.findIndex(child => child.id === parentId);
          if (childIndex !== -1) {
            parent = note.children[childIndex];
            parentPath = getNotePath(notes, parentId);
            // 确保父级层级是正确的数字，如果note.level不存在则默认为1
            const noteLevel = note.level || 1;
            parentLevel = parent.level || (noteLevel + 1);
            
            console.log(`找到嵌套父笔记: ${parent.title}, 层级=${parentLevel}`);
            
            // 检查子级数量是否超过限制
            if (settings.maxChildren > 0 && parent.children && parent.children.length >= settings.maxChildren) {
              return { error: true, message: `超过最大子级数量限制(${settings.maxChildren}个)` };
            }
            return true;
          }
          
          // 递归检查子笔记的子笔记
          const result = findParent(note.children);
          if (result === true) return true;
          if (result && result.error) return result;
        }
      }
      return false;
    };
    
    const result = findParent(notes);
    if (result && result.error) {
      return { error: result.message };
    }
  }
  
  // 如果找到父笔记
  if (parent) {
    // 检查是否超过了最大层级限制
    const maxLevel = settings.maxLevel || 5; // 默认最大层级为5
    // 新笔记的层级是父笔记的层级+1
    const newLevel = parentLevel + 1;
    
    console.log(`准备添加新笔记: 父级层级=${parentLevel}, 新层级=${newLevel}, 最大层级限制=${maxLevel}`);
    
    if (newLevel > maxLevel) {
      console.log(`无法添加: 超过最大层级限制`);
      return { error: `超过最大层级限制(${maxLevel}层)` };
    }
    
    // 创建新的子笔记
    const newSubnote = {
      id: uuidv4(),
      title: title,
      content: '',
      created: Date.now(),
      type: 'subnote',
      parentId: parentId,
      children: [], // 支持子笔记也可以有子笔记
      level: newLevel  // 确保明确设置层级
    };
    
    console.log(`创建新笔记成功: ID=${newSubnote.id}, 层级=${newLevel}`);
    
    // 确保父笔记有children属性
    if (!parent.children) {
      parent.children = [];
    }
    
    // 构建文件名（父级路径-当前标题）
    const sanitizedTitle = title.replace(/[\\/:*?"<>|]/g, '_');
    const pathWithTitle = [...parentPath, sanitizedTitle];
    
    // 创建文件名
    const fileName = pathWithTitle.join('-') + '.txt';
    const filePath = path.join(notesDir, fileName);
    
    // 如果文件已存在，添加时间戳区分
    let finalFilePath = filePath;
    if (fs.existsSync(filePath)) {
      const timestamp = Date.now();
      finalFilePath = path.join(notesDir, `${pathWithTitle.join('-')}_${timestamp}.txt`);
    }
    
    // 保存文件路径
    newSubnote.filePath = path.basename(finalFilePath);
    
    // 写入文件到用户目录
    fs.writeFileSync(finalFilePath, '', 'utf8');
    
    // 同时写入到APP目录
    const appFilePath = path.join(appBackupDir, path.basename(finalFilePath));
    fs.writeFileSync(appFilePath, '', 'utf8');
    
    // 将新子笔记添加到父笔记
    if (outlineIndex !== -1) {
      // 直接添加到顶层笔记
      notes[outlineIndex].children.push(newSubnote);
    } else {
      // 递归添加到多层嵌套的父笔记
      const addToParent = (notesList) => {
        for (let i = 0; i < notesList.length; i++) {
          const note = notesList[i];
          if (note.id === parentId) {
            if (!note.children) note.children = [];
            note.children.push(newSubnote);
            return true;
          }
          
          if (note.children && note.children.length > 0) {
            if (addToParent(note.children)) {
              return true;
            }
          }
        }
        return false;
      };
      
      addToParent(notes);
    }
    
    store.set('notes', notes);
    return newSubnote;
  }
  
  console.log(`未找到父笔记: ${parentId}`);
  return null;
});

// 获取笔记的完整路径（标题链）
function getNotePath(notes, noteId) {
  const path = [];
  
  // 查找笔记并构建路径
  const findPath = (notesList, targetId, currentPath = []) => {
    for (const note of notesList) {
      if (note.id === targetId) {
        return [...currentPath, note.title];
      }
      
      if (note.children && note.children.length > 0) {
        const foundPath = findPath(note.children, targetId, [...currentPath, note.title]);
        if (foundPath) return foundPath;
      }
    }
    return null;
  };
  
  // 顶层笔记直接处理
  const topLevelNote = notes.find(note => note.id === noteId);
  if (topLevelNote) {
    return [topLevelNote.title];
  }
  
  // 递归查找嵌套笔记
  for (const note of notes) {
    if (note.children && note.children.length > 0) {
      const foundPath = findPath(note.children, noteId, [note.title]);
      if (foundPath) return foundPath;
    }
  }
  
  return [];
}

// 获取笔记内容
ipcMain.handle('get-note', (event, id) => {
  const notes = store.get('notes');
  
  // 递归查找笔记
  const findNote = (notesList) => {
    for (const note of notesList) {
      if (note.id === id) {
        try {
          const filePath = path.join(notesDir, note.filePath || `${note.type === 'outline' ? 'outline_' : 'subnote_'}${id}.txt`);
          
          // 如果文件不存在，创建一个空文件
          if (!fs.existsSync(filePath)) {
            // 尝试备用路径（兼容旧数据）
            const oldPath = path.join(notesDir, `${note.type === 'outline' ? 'outline_' : 'subnote_'}${id}.txt`);
            if (fs.existsSync(oldPath)) {
              note.content = fs.readFileSync(oldPath, 'utf8');
              return note;
            }
            fs.writeFileSync(filePath, '', 'utf8');
            
            // 同时创建APP目录下的备份
            const appFilePath = path.join(appBackupDir, note.filePath || `${note.type === 'outline' ? 'outline_' : 'subnote_'}${id}.txt`);
            fs.writeFileSync(appFilePath, '', 'utf8');
          }
          
          // 读取文件内容
          note.content = fs.readFileSync(filePath, 'utf8');
          return note;
        } catch (error) {
          console.error(`读取笔记 ${note.title} 失败:`, error);
          return note;
        }
      }
      
      // 递归检查子笔记
      if (note.children && note.children.length > 0) {
        const foundNote = findNote(note.children);
        if (foundNote) {
          return foundNote;
        }
      }
    }
    return null;
  };
  
  return findNote(notes);
});

// 更新笔记内容
ipcMain.handle('update-note', (event, id, content, timestamp) => {
  const notes = store.get('notes');
  
  // 查找笔记
  let note = null;
  
  // 递归查找笔记
  const findNote = (notesList) => {
    for (const n of notesList) {
      if (n.id === id) {
        note = n;
        return true;
      }
      
      if (n.children && n.children.length > 0) {
        if (findNote(n.children)) {
          return true;
        }
      }
    }
    return false;
  };
  
  // 首先检查顶层笔记
  const outlineIndex = notes.findIndex(n => n.id === id);
  if (outlineIndex !== -1) {
    note = notes[outlineIndex];
  } else {
    // 递归查找多层嵌套的笔记
    findNote(notes);
  }
  
  if (note) {
    try {
      // 将内容保存到文件
      const filePath = path.join(notesDir, note.filePath || `${note.type === 'outline' ? 'outline_' : 'subnote_'}${id}.txt`);
      fs.writeFileSync(filePath, content, 'utf8');
      
      // 同时更新APP目录中的文件
      const appFilePath = path.join(appBackupDir, note.filePath || `${note.type === 'outline' ? 'outline_' : 'subnote_'}${id}.txt`);
      fs.writeFileSync(appFilePath, content, 'utf8');
      
      // 更新最后修改时间
      note.updated = timestamp || Date.now();
      store.set('notes', notes);
      return true;
    } catch (error) {
      console.error('更新笔记失败:', error);
      return false;
    }
  }
  
  return false;
});

// 删除笔记
ipcMain.handle('delete-note', (event, id) => {
  const notes = store.get('notes');
  
  // 递归删除笔记及其所有子笔记
  const deleteNoteRecursive = (note) => {
    try {
      // 删除当前笔记文件
      const filePath = path.join(notesDir, note.filePath || `${note.type === 'outline' ? 'outline_' : 'subnote_'}${note.id}.txt`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // 删除APP目录中的文件
      const appFilePath = path.join(appBackupDir, note.filePath || `${note.type === 'outline' ? 'outline_' : 'subnote_'}${note.id}.txt`);
      if (fs.existsSync(appFilePath)) {
        fs.unlinkSync(appFilePath);
      }
      
      // 递归删除所有子笔记
      if (note.children && note.children.length > 0) {
        for (const child of note.children) {
          deleteNoteRecursive(child);
        }
      }
      
      return true;
    } catch (error) {
      console.error(`删除笔记 ${note.title} 失败:`, error);
      return false;
    }
  };
  
  // 递归从笔记树中移除笔记
  const removeNoteFromTree = (notesList, targetId) => {
    for (let i = 0; i < notesList.length; i++) {
      if (notesList[i].id === targetId) {
        // 找到目标笔记，删除它
        deleteNoteRecursive(notesList[i]);
        notesList.splice(i, 1);
        return true;
      }
      
      // 检查子笔记
      if (notesList[i].children && notesList[i].children.length > 0) {
        if (removeNoteFromTree(notesList[i].children, targetId)) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  // 尝试删除笔记
  if (removeNoteFromTree(notes, id)) {
    store.set('notes', notes);
    return true;
  }
  
  return false;
});

// 处理图片保存
ipcMain.handle('save-image', async (event, dataUrl) => {
  try {
    // 创建保存图片的目录
    const imagesDir = path.join(app.getPath('userData'), 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    // 从dataUrl提取数据
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // 生成唯一的文件名
    const fileName = `image-${Date.now()}.png`;
    const filePath = path.join(imagesDir, fileName);
    
    // 保存图片
    fs.writeFileSync(filePath, buffer);
    
    // 返回相对路径
    return {
      filePath: `file://${filePath.replace(/\\/g, '/')}`,
      fileName: fileName
    };
  } catch (error) {
    console.error('保存图片失败:', error);
    return null;
  }
});

// 处理背景图片上传
ipcMain.handle('choose-background-image', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }
      ]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const imagePath = result.filePaths[0];
      
      // 创建背景图片目录
      const backgroundsDir = path.join(app.getPath('userData'), 'backgrounds');
      if (!fs.existsSync(backgroundsDir)) {
        fs.mkdirSync(backgroundsDir, { recursive: true });
      }
      
      // 复制图片到应用数据目录
      const fileName = `bg-${Date.now()}${path.extname(imagePath)}`;
      const destPath = path.join(backgroundsDir, fileName);
      
      fs.copyFileSync(imagePath, destPath);
      
      // 确保返回正确的文件URL格式，特别是在Windows上
      // Windows路径需要额外处理，确保格式为 file:///C:/path/to/file
      let fileUrl;
      if (process.platform === 'win32') {
        // Windows路径处理
        fileUrl = 'file:///' + destPath.replace(/\\/g, '/');
      } else {
        // 其他系统
        fileUrl = 'file://' + destPath;
      }
      
      console.log('背景图片路径:', fileUrl);
      
      return {
        success: true,
        path: fileUrl,
        fileName: fileName
      };
    }
    
    return { success: false };
  } catch (error) {
    console.error('选择背景图片失败:', error);
    return { success: false, error: error.message };
  }
});

// 选择备份路径
ipcMain.handle('choose-backup-path', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      return {
        success: true,
        path: result.filePaths[0]
      };
    }
    
    return { success: false };
  } catch (error) {
    console.error('选择备份路径失败:', error);
    return { success: false, error: error.message };
  }
});

// 执行备份操作
ipcMain.handle('backup-notes', async (event, backupConfig) => {
  try {
    const { selectedNotes, backupPath, autoSync } = backupConfig;
    
    if (!selectedNotes || selectedNotes.length === 0 || !backupPath) {
      return { success: false, error: '备份信息不完整' };
    }
    
    // 确保备份目录存在
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }
    
    const notes = store.get('notes');
    const backupResults = [];
    
    // 处理所选笔记的备份
    for (const selectedId of selectedNotes) {
      // 查找笔记（可能是大纲或子笔记）
      let note = null;
      let isOutline = false;
      let parentTitle = '';
      
      // 先检查是否为大纲
      note = notes.find(n => n.id === selectedId);
      if (note) {
        isOutline = true;
      } else {
        // 检查是否为子笔记
        for (const outline of notes) {
          if (outline.children) {
            const subnote = outline.children.find(s => s.id === selectedId);
            if (subnote) {
              note = subnote;
              parentTitle = outline.title;
              break;
            }
          }
        }
      }
      
      if (note) {
        // 读取笔记内容
        try {
          const filePath = path.join(notesDir, note.filePath || (isOutline ? `outline_${note.id}.txt` : `subnote_${note.id}.txt`));
          
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // 创建备份文件名
            let backupFileName;
            if (isOutline) {
              backupFileName = `${note.title.replace(/[\\/:*?"<>|]/g, '_')}.txt`;
            } else {
              backupFileName = `${parentTitle.replace(/[\\/:*?"<>|]/g, '_')}-${note.title.replace(/[\\/:*?"<>|]/g, '_')}.txt`;
            }
            
            // 写入备份文件
            const backupFilePath = path.join(backupPath, backupFileName);
            fs.writeFileSync(backupFilePath, content, 'utf8');
            
            backupResults.push({
              id: note.id, 
              title: note.title,
              path: backupFilePath,
              success: true
            });
          }
        } catch (error) {
          console.error(`备份笔记 ${note.title} 失败:`, error);
          backupResults.push({
            id: note.id,
            title: note.title,
            success: false,
            error: error.message
          });
        }
      }
    }
    
    // 如果开启了自动同步，保存备份配置
    if (autoSync) {
      // 获取当前所有备份配置
      const backups = [...(store.get('settings.backups') || [])];
      
      // 创建新的备份配置
      const newBackupConfig = {
        id: uuidv4(),
        notes: selectedNotes,
        path: backupPath,
        lastBackup: Date.now()
      };
      
      // 添加到备份列表
      backups.push(newBackupConfig);
      
      // 更新配置
      const settings = store.get('settings');
      settings.backups = backups;
      store.set('settings', settings);
    }
    
    return {
      success: true,
      results: backupResults
    };
  } catch (error) {
    console.error('执行备份失败:', error);
    return { success: false, error: error.message };
  }
});

// 监听笔记更新以自动同步备份
ipcMain.on('note-updated', async (event, noteId, content) => {
  try {
    // 获取所有备份配置
    const backups = store.get('settings.backups') || [];
    
    // 找出包含该笔记的所有备份配置
    const relevantBackups = backups.filter(backup => backup.notes.includes(noteId));
    
    if (relevantBackups.length === 0) return;
    
    const notes = store.get('notes');
    
    // 找到笔记（大纲或子笔记）
    let note = null;
    let isOutline = false;
    let parentTitle = '';
    
    // 先检查是否为大纲
    note = notes.find(n => n.id === noteId);
    if (note) {
      isOutline = true;
    } else {
      // 检查是否为子笔记
      for (const outline of notes) {
        if (outline.children) {
          const subnote = outline.children.find(s => s.id === noteId);
          if (subnote) {
            note = subnote;
            parentTitle = outline.title;
            break;
          }
        }
      }
    }
    
    if (!note) return;
    
    // 为每个相关备份更新文件
    for (const backup of relevantBackups) {
      try {
        // 创建备份文件名
        let backupFileName;
        if (isOutline) {
          backupFileName = `${note.title.replace(/[\\/:*?"<>|]/g, '_')}.txt`;
        } else {
          backupFileName = `${parentTitle.replace(/[\\/:*?"<>|]/g, '_')}-${note.title.replace(/[\\/:*?"<>|]/g, '_')}.txt`;
        }
        
        // 写入备份文件
        const backupFilePath = path.join(backup.path, backupFileName);
        fs.writeFileSync(backupFilePath, content, 'utf8');
        
        // 更新最后备份时间
        backup.lastBackup = Date.now();
      } catch (error) {
        console.error(`自动同步备份笔记 ${note.title} 失败:`, error);
      }
    }
    
    // 更新备份配置
    const settings = store.get('settings');
    settings.backups = backups;
    store.set('settings', settings);
  } catch (error) {
    console.error('自动同步备份失败:', error);
  }
});

// 初始化设置
const defaultSettings = {
  theme: 'light',
  foldTitles: false,
  opacity: 100,
  background: {
    type: 'none', // none, color, image, url
    value: '',
    opacity: 100, // 添加背景透明度默认值
    blur: 0, // 添加背景模糊度默认值
    zIndex: -1 // 添加背景显示层级默认值
  },
  backups: [], // 用于存储备份配置
  emojiTips: false, // 表情包提示
  buttonPosition: 'left' // 按钮位置
};

// 更新Store默认设置
store.set('settings', {...defaultSettings, ...store.get('settings')});

// 确保背景设置包含透明度、模糊度和显示层级
const currentSettings = store.get('settings');
if (currentSettings.background && !currentSettings.background.hasOwnProperty('opacity')) {
  currentSettings.background.opacity = 100;
}
if (currentSettings.background && !currentSettings.background.hasOwnProperty('blur')) {
  currentSettings.background.blur = 0;
}
if (currentSettings.background && !currentSettings.background.hasOwnProperty('zIndex')) {
  currentSettings.background.zIndex = -1;
}
store.set('settings', currentSettings);

// 处理打开外部链接
ipcMain.handle('open-external-link', async (event, url) => {
  try {
    await shell.openExternal(url);
    return true;
  } catch (error) {
    console.error('打开外部链接失败:', error);
    return false;
  }
});

// 处理选择图标图片
ipcMain.handle('choose-icon-image', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'ico'] }
      ]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      const imagePath = result.filePaths[0];
      
      // 创建图标图片目录
      const iconsDir = path.join(app.getPath('userData'), 'icons');
      if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir, { recursive: true });
      }
      
      // 复制图片到应用数据目录
      const fileName = `icon-${Date.now()}${path.extname(imagePath)}`;
      const destPath = path.join(iconsDir, fileName);
      
      fs.copyFileSync(imagePath, destPath);
      
      return {
        success: true,
        path: `file://${destPath.replace(/\\/g, '/')}`,
        fileName: fileName
      };
    }
    
    return { success: false };
  } catch (error) {
    console.error('选择图标图片失败:', error);
    return { success: false, error: error.message };
  }
});

// 处理保存分享笔记
ipcMain.handle('save-shared-note', async (event, options) => {
  try {
    const { content, fileType, fileName } = options;
    
    // 显示保存文件对话框
    const result = await dialog.showSaveDialog({
      title: '保存笔记',
      defaultPath: fileName,
      filters: [
        { name: '所有文件', extensions: ['*'] }
      ]
    });
    
    if (result.canceled || !result.filePath) {
      return { success: false };
    }
    
    // 写入文件
    fs.writeFileSync(result.filePath, content, 'utf8');
    
    return {
      success: true,
      filePath: result.filePath
    };
  } catch (error) {
    console.error('保存分享笔记失败:', error);
    return { 
      success: false,
      error: error.message
    };
  }
});

// 导出笔记为图片
ipcMain.handle('export-note-as-image', async (event, noteId) => {
  try {
    // 获取笔记内容
    const notes = store.get('notes');
    let note = null;
    
    // 递归查找笔记
    const findNote = (notesList) => {
      for (const n of notesList) {
        if (n.id === noteId) {
          return n;
        }
        
        if (n.children && n.children.length > 0) {
          const found = findNote(n.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    note = findNote(notes);
    
    if (!note) {
      return { success: false, error: '找不到笔记' };
    }
    
    // 使用BrowserWindow捕获笔记内容为图片
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      show: false,
      webPreferences: {
        offscreen: true
      }
    });
    
    // 创建一个临时HTML文件
    const tempHtmlPath = path.join(app.getPath('temp'), `note-${Date.now()}.html`);
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${note.title}</title>
        <style>
          body {
            font-family: 'Microsoft YaHei', 'SimHei', Arial, sans-serif;
            padding: 30px;
            line-height: 1.6;
            color: #333;
            background-color: white;
          }
          h1 {
            color: #4a69bd;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
          }
          img {
            max-width: 100%;
          }
        </style>
      </head>
      <body>
        <h1>${note.title}</h1>
        <div>${note.content}</div>
      </body>
      </html>
    `;
    
    fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');
    
    // 加载HTML文件
    await win.loadFile(tempHtmlPath);
    
    // 等待页面渲染完成
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 捕获页面截图
    const image = await win.webContents.capturePage();
    const pngBuffer = image.toPNG();
    
    // 显示保存文件对话框
    const result = await dialog.showSaveDialog({
      title: '保存为图片',
      defaultPath: `${note.title.replace(/[\\/:*?"<>|]/g, '_')}.png`,
      filters: [
        { name: '图片文件', extensions: ['png'] }
      ]
    });
    
    if (result.canceled || !result.filePath) {
      // 清理临时文件
      fs.unlinkSync(tempHtmlPath);
      win.close();
      return { success: false };
    }
    
    // 保存图片
    fs.writeFileSync(result.filePath, pngBuffer);
    
    // 清理临时文件和窗口
    fs.unlinkSync(tempHtmlPath);
    win.close();
    
    return {
      success: true,
      filePath: result.filePath
    };
  } catch (error) {
    console.error('导出笔记为图片失败:', error);
    return { 
      success: false,
      error: error.message
    };
  }
});

// 获取系统应用列表
ipcMain.handle('get-system-apps', async () => {
  try {
    // 根据操作系统获取不同的应用列表
    if (process.platform === 'win32') {
      // Windows 系统使用 PowerShell 获取安装的应用列表
      const { exec } = require('child_process');
      
      return new Promise((resolve) => {
        exec('powershell -Command "Get-StartApps | ConvertTo-Json"', { encoding: 'utf8' }, (error, stdout) => {
          if (error) {
            console.error('获取应用列表失败:', error);
            resolve([]);
            return;
          }
          
          try {
            // 解析 PowerShell 输出的 JSON
            const appsData = JSON.parse(stdout);
            const apps = Array.isArray(appsData) ? appsData : [appsData];
            
            // 格式化应用数据
            const formattedApps = apps.map(app => ({
              name: app.Name,
              path: app.AppID, // Windows 应用的 AppID
              icon: '' // Windows 应用图标暂不支持
            }));
            
            resolve(formattedApps);
          } catch (err) {
            console.error('解析应用列表失败:', err);
            resolve([]);
          }
        });
      });
    } else if (process.platform === 'darwin') {
      // macOS 系统使用 AppleScript 获取应用列表
      const { execFile } = require('child_process');
      
      return new Promise((resolve) => {
        execFile('osascript', ['-e', 'tell application "Finder" to get the name of every application file of the application folder'], { encoding: 'utf8' }, (error, stdout) => {
          if (error) {
            console.error('获取应用列表失败:', error);
            resolve([]);
            return;
          }
          
          try {
            // 解析应用名称列表
            const appNames = stdout.trim().split(', ');
            
            // 格式化应用数据
            const formattedApps = appNames.map(name => ({
              name: name.replace('.app', ''),
              path: `/Applications/${name}`,
              icon: '' // macOS 应用图标暂不支持
            }));
            
            resolve(formattedApps);
          } catch (err) {
            console.error('解析应用列表失败:', err);
            resolve([]);
          }
        });
      });
    } else {
      // Linux 或其他操作系统
      console.log('当前操作系统不支持获取应用列表');
      return [];
    }
  } catch (error) {
    console.error('获取系统应用列表失败:', error);
    return [];
  }
});

// 更新笔记元数据
ipcMain.handle('update-note-metadata', async (event, noteId, metadata) => {
  try {
    const notes = store.get('notes');
    
    // 递归查找笔记
    const findAndUpdateNote = (notesList) => {
      for (let i = 0; i < notesList.length; i++) {
        if (notesList[i].id === noteId) {
          // 找到笔记，更新元数据
          notesList[i].metadata = metadata;
          return true;
        }
        
        // 检查子笔记
        if (notesList[i].children && notesList[i].children.length > 0) {
          if (findAndUpdateNote(notesList[i].children)) {
            return true;
          }
        }
      }
      return false;
    };
    
    // 更新笔记元数据
    if (findAndUpdateNote(notes)) {
      store.set('notes', notes);
      return { success: true };
    } else {
      return { success: false, error: '笔记未找到' };
    }
  } catch (error) {
    console.error('更新笔记元数据失败:', error);
    return { success: false, error: error.message };
  }
});

// 修改 share-with-app 函数，添加 webLink 参数支持
ipcMain.handle('share-with-app', async (event, { appPath, filePath, webLink }) => {
  try {
    if (process.platform === 'win32') {
      // Windows 系统处理
      const { exec } = require('child_process');
      
      if (webLink) {
        // 如果提供了网站链接，尝试打开该链接
        // 对于社交软件，我们尝试使用特定的协议或命令行参数
        
        let command = '';
        
        // 根据不同的应用ID处理
        switch (appPath) {
          case 'WeChat':
            // 微信可能不支持直接通过命令行打开链接，尝试使用通用方法
            command = `start msedge.exe "${webLink}"`;
            break;
            
          case 'QQ':
            // QQ可能支持特定协议
            command = `start tencent://message/?menu=yes&url=${encodeURIComponent(webLink)}`;
            break;
            
          case 'Weibo':
            // 微博可能支持特定协议
            command = `start sinaweibo://share?url=${encodeURIComponent(webLink)}`;
            break;
            
          default:
            // 对于其他应用，尝试直接使用浏览器打开
            command = `start "" "${webLink}"`;
            break;
        }
        
        exec(command, (error) => {
          if (error) {
            console.error('打开链接失败:', error);
            // 如果特定方法失败，尝试使用默认浏览器打开
            shell.openExternal(webLink);
          }
        });
      } else {
        // 如果没有提供网站链接，尝试使用应用打开文件
        exec(`powershell -Command "Start-Process '${appPath}' -ArgumentList '${filePath}'"`, (error) => {
          if (error) {
            // 如果无法直接启动，尝试使用默认方式打开
            shell.openPath(filePath);
          }
        });
      }
      
      return { success: true };
    } else if (process.platform === 'darwin') {
      // macOS 系统处理
      const { exec } = require('child_process');
      
      if (webLink) {
        // 尝试打开网站链接
        exec(`open "${webLink}"`, (error) => {
          if (error) {
            console.error('打开链接失败:', error);
            shell.openExternal(webLink);
          }
        });
      } else {
        // 打开文件
        exec(`open -a "${appPath}" "${filePath}"`, (error) => {
          if (error) {
            shell.openPath(filePath);
          }
        });
      }
      
      return { success: true };
    } else {
      // 其他系统处理
      if (webLink) {
        await shell.openExternal(webLink);
      } else {
        await shell.openPath(filePath);
      }
      return { success: true };
    }
  } catch (error) {
    console.error('使用应用打开失败:', error);
    return { success: false, error: error.message };
  }
});

// 使用系统默认方式打开文件
ipcMain.handle('share-with-default-app', async (event, filePath) => {
  try {
    await shell.openPath(filePath);
    return { success: true };
  } catch (error) {
    console.error('使用默认方式打开文件失败:', error);
    return { success: false, error: error.message };
  }
});

// 打开内存档文件夹
ipcMain.handle('open-memory-archive', async () => {
  try {
    const memoryArchivePath = path.join(process.cwd(), 'APP', 'handwriting-book');
    if (!fs.existsSync(memoryArchivePath)) {
      fs.mkdirSync(memoryArchivePath, { recursive: true });
    }
    
    // 使用shell.openPath打开文件夹
    await shell.openPath(memoryArchivePath);
    return { success: true };
  } catch (error) {
    console.error('打开内存档文件夹失败:', error);
    return { success: false, error: error.message };
  }
});

// 创建临时文件用于分享
ipcMain.handle('create-temp-files-for-sharing', async (event, { title, textContent, htmlContent }) => {
  try {
    // 创建临时文件夹
    const tmpDir = path.join(app.getPath('temp'), 'xiaojishi-share');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    // 清理可能存在的旧文件
    const oldFiles = fs.readdirSync(tmpDir);
    for (const file of oldFiles) {
      fs.unlinkSync(path.join(tmpDir, file));
    }
    
    // 创建安全的文件名
    const safeTitle = title.replace(/[\\/:*?"<>|]/g, '_');
    
    // 创建文本文件
    const textPath = path.join(tmpDir, `${safeTitle}.txt`);
    fs.writeFileSync(textPath, textContent, 'utf8');
    
    // 创建HTML文件
    const htmlPath = path.join(tmpDir, `${safeTitle}.html`);
    fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    
    return {
      success: true,
      textPath,
      htmlPath
    };
  } catch (error) {
    console.error('创建临时文件失败:', error);
    return { success: false, error: error.message };
  }
});

// 打开系统文件选择对话框选择应用程序
ipcMain.handle('select-app-dialog', async () => {
  try {
    let filters = [];
    
    // 根据操作系统设置不同的过滤器
    if (process.platform === 'win32') {
      filters = [
        { name: '应用程序', extensions: ['exe', 'lnk', 'appx', 'msi'] }
      ];
    } else if (process.platform === 'darwin') {
      filters = [
        { name: '应用程序', extensions: ['app'] }
      ];
    } else {
      filters = [
        { name: '应用程序', extensions: ['*'] }
      ];
    }
    
    // 显示文件选择对话框
    const result = await dialog.showOpenDialog({
      title: '选择应用程序',
      properties: ['openFile'],
      filters: filters
    });
    
    if (result.canceled || !result.filePaths.length) {
      return { success: false };
    }
    
    // 获取选中的应用程序路径
    const appPath = result.filePaths[0];
    
    // 获取应用程序名称
    const appName = path.basename(appPath, path.extname(appPath));
    
    return {
      success: true,
      path: appPath,
      name: appName
    };
  } catch (error) {
    console.error('选择应用程序失败:', error);
    return { success: false, error: error.message };
  }
});

// 发送邮件
ipcMain.handle('send-email', async (event, { fromEmail, toEmail, subject, content }) => {
  try {
    // 使用系统默认邮件应用打开邮件
    let mailtoUrl = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(content)}`;
    
    // 如果有发件人，添加到邮件头
    if (fromEmail) {
      mailtoUrl += `&from=${encodeURIComponent(fromEmail)}`;
    }
    
    // 使用默认浏览器打开mailto链接
    await shell.openExternal(mailtoUrl);
    
    return { success: true };
  } catch (error) {
    console.error('发送邮件失败:', error);
    return { success: false, error: error.message };
  }
});

// 使用系统默认"打开方式"对话框打开文件
ipcMain.handle('open-with-dialog', async (event, filePath) => {
  try {
    if (process.platform === 'win32') {
      // Windows系统使用rundll32调用OpenAs_RunDLL显示"打开方式"对话框
      const { execSync } = require('child_process');
      
      try {
        // 使用同步方式执行，确保命令执行成功
        execSync(`rundll32.exe shell32.dll,OpenAs_RunDLL "${filePath}"`, {
          windowsHide: false, // 确保窗口可见
          stdio: 'ignore' // 忽略标准输出
        });
        return { success: true };
      } catch (error) {
        console.error('打开"打开方式"对话框失败:', error);
        // 如果失败，尝试使用另一种方法
        try {
          // 尝试使用cmd /c start命令
          execSync(`cmd /c start "" "${filePath}"`, {
            windowsHide: false,
            stdio: 'ignore'
          });
          return { success: true };
        } catch (cmdError) {
          console.error('使用cmd打开文件失败:', cmdError);
          // 如果还是失败，尝试直接使用shell.openPath
          await shell.openPath(filePath);
          return { success: true, fallback: true };
        }
      }
    } else if (process.platform === 'darwin') {
      // macOS系统
      const { execSync } = require('child_process');
      
      try {
        // 在macOS上尝试使用open命令打开文件
        execSync(`open "${filePath}"`, {
          stdio: 'ignore'
        });
        return { success: true };
      } catch (error) {
        console.error('macOS打开文件失败:', error);
        // 如果失败，尝试使用默认程序打开
        await shell.openPath(filePath);
        return { success: true, fallback: true };
      }
    } else {
      // 其他系统，尝试直接打开文件
      await shell.openPath(filePath);
      return { success: true };
    }
  } catch (error) {
    console.error('使用"打开方式"对话框打开文件失败:', error);
    return { success: false, error: error.message };
  }
});

// 添加更新笔记标题的处理程序
ipcMain.handle('update-note-title', async (event, noteId, newTitle) => {
  try {
    const notes = store.get('notes');
    
    // 递归查找笔记
    const findAndUpdateNote = (notesList) => {
      for (let i = 0; i < notesList.length; i++) {
        if (notesList[i].id === noteId) {
          // 找到笔记，更新标题
          notesList[i].title = newTitle;
          return true;
        }
        
        // 检查子笔记
        if (notesList[i].children && notesList[i].children.length > 0) {
          if (findAndUpdateNote(notesList[i].children)) {
            return true;
          }
        }
      }
      return false;
    };
    
    // 更新笔记标题
    if (findAndUpdateNote(notes)) {
      store.set('notes', notes);
      return { success: true };
    } else {
      return { success: false, error: '笔记未找到' };
    }
  } catch (error) {
    console.error('更新笔记标题失败:', error);
    return { success: false, error: error.message };
  }
});

// 拖拽相关缓存和设置
const dragCache = {
  lastRequestId: null,
  lastFilePath: null,
  lastTimestamp: 0
};

// 为拖拽准备文件（支持直接拖放到桌面）
ipcMain.handle('prepare-file-for-drag', async (event, { fileName, content, noteId, requestId }) => {
  try {
    // 防止短时间内重复调用（1秒内的相同请求视为重复）
    const now = Date.now();
    if (requestId && dragCache.lastRequestId === requestId && (now - dragCache.lastTimestamp) < 1000) {
      console.log('忽略重复的拖拽请求');
      return {
        success: true,
        filePath: dragCache.lastFilePath,
        reused: true
      };
    }
    
    // 更新缓存信息
    dragCache.lastRequestId = requestId;
    dragCache.lastTimestamp = now;
    
    // 获取桌面路径
    const desktopPath = app.getPath('desktop');
    
    // 创建一个安全的文件名（去除所有特殊字符）
    const safeFileName = fileName.replace(/[\\/:*?"<>|]/g, '_');
    
    // 检查是否存在同名文件
    let destFilePath = path.join(desktopPath, safeFileName);
    let counter = 1;
    while (fs.existsSync(destFilePath)) {
      const nameParts = safeFileName.split('.');
      const ext = nameParts.pop() || 'txt';
      const baseName = nameParts.join('.');
      destFilePath = path.join(desktopPath, `${baseName} (${counter}).${ext}`);
      counter++;
    }
    
    // 写入文件到桌面
    fs.writeFileSync(destFilePath, content, { encoding: 'utf8' });
    
    console.log(`文件已保存到桌面: ${destFilePath}`);
    
    // 更新缓存的文件路径
    dragCache.lastFilePath = destFilePath;
    
    return {
      success: true,
      filePath: destFilePath
    };
  } catch (error) {
    console.error('准备拖拽文件失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// 当拖放失败时导出文件到桌面
ipcMain.handle('export-file-to-desktop', async (event, { noteId, dropFailed }) => {
  try {
    // 获取桌面路径
    const desktopPath = app.getPath('desktop');
    
    // 获取笔记内容
    const notes = store.get('notes');
    
    // 递归查找笔记
    const findNote = (notesList) => {
      for (const note of notesList) {
        if (note.id === noteId) {
          return note;
        }
        
        if (note.children && note.children.length > 0) {
          const found = findNote(note.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    const note = findNote(notes);
    
    if (!note) {
      return { success: false, error: '找不到笔记' };
    }
    
    // 准备导出的文本内容 - 只包含当前笔记的标题和内容
    let textContent = `${note.title}\n\n`;
    
    // 从文件读取笔记内容
    try {
      const filePath = path.join(notesDir, note.filePath || `${note.type === 'outline' ? 'outline_' : 'subnote_'}${noteId}.txt`);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 从HTML提取纯文本
        const cheerio = require('cheerio');
        const $ = cheerio.load(`<div>${content}</div>`);
        textContent += $.text();
      }
    } catch (error) {
      console.error('读取笔记内容失败:', error);
      // 如果读取失败，使用空内容
      textContent += '';
    }
    
    // 创建安全的文件名
    const originalTitle = note.title;
    // 确保正确编码（修复中文问题）
    let safeTitle = Buffer.from(originalTitle).toString('utf8');
    // 移除不安全字符
    safeTitle = safeTitle.replace(/[\\/:*?"<>|]/g, '_');
    const fileName = `${safeTitle}.txt`;
    
    // 导出到桌面
    const desktopFilePath = path.join(desktopPath, fileName);
    
    // 检查文件是否已存在
    let finalPath = desktopFilePath;
    if (fs.existsSync(desktopFilePath)) {
      // 添加时间戳
      const timestamp = Date.now();
      finalPath = path.join(desktopPath, `${safeTitle}_${timestamp}.txt`);
    }
    
    // 写入文件
    fs.writeFileSync(finalPath, textContent, 'utf8');
    
    return {
      success: true,
      filePath: finalPath
    };
  } catch (error) {
    console.error('导出文件到桌面失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// 导出文本到桌面
ipcMain.handle('export-text-to-desktop', async (event, { content, fileName, dropFailed }) => {
  try {
    // 获取桌面路径
    const desktopPath = app.getPath('desktop');
    
    // 确保文件名正确编码
    let safeFileName = Buffer.from(fileName).toString('utf8');
    // 移除不安全字符
    safeFileName = safeFileName.replace(/[\\/:*?"<>|]/g, '_');
    
    // 导出到桌面
    const desktopFilePath = path.join(desktopPath, safeFileName);
    
    // 检查文件是否已存在
    let finalPath = desktopFilePath;
    if (fs.existsSync(desktopFilePath)) {
      // 添加时间戳
      const timestamp = Date.now();
      const ext = path.extname(safeFileName);
      const name = path.basename(safeFileName, ext);
      finalPath = path.join(desktopPath, `${name}_${timestamp}${ext}`);
    }
    
    // 写入文件
    fs.writeFileSync(finalPath, content, 'utf8');
    
    return {
      success: true,
      filePath: finalPath
    };
  } catch (error) {
    console.error('导出文本到桌面失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// 处理服务器上传请求
ipcMain.handle('upload-to-server', async (event, { notes, serverConfig }) => {
  try {
    console.log('准备上传笔记到服务器:', serverConfig.url);
    console.log(`上传 ${notes.length} 个笔记`);
    
    // 这里只是返回成功，实际上传逻辑在renderer.js中实现
    // 如果需要在主进程中处理上传逻辑，可以在这里添加
    return {
      success: true,
      message: `已准备好 ${notes.length} 个笔记的上传数据`
    };
  } catch (error) {
    console.error('准备上传数据失败:', error);
    return {
      success: false,
      error: error.message || '准备上传数据失败'
    };
  }
}); 