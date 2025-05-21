// 颜色测试脚本
console.log('颜色测试脚本已加载');

// 在页面完全加载后执行
window.addEventListener('load', () => {
  setTimeout(() => {
    // 记录当前函数的来源位置
    console.log('========= 颜色函数来源检查 =========');
    
    if (typeof window.applyTitleColor === 'function') {
      // 尝试获取函数内容并检查特征代码
      const funcStr = window.applyTitleColor.toString();
      
      console.log('当前applyTitleColor函数长度:', funcStr.length);
      
      if (funcStr.includes('color-fix-new.js') || (window.applyTitleColor.source === 'color-fix-new.js')) {
        console.log('当前使用的是 color-fix-new.js 中的函数 ✓');
      } else if (funcStr.includes('genre-color.js')) {
        console.log('当前使用的是 genre-color.js 中的函数 ⚠');
        // 尝试强制重新初始化
        forceReinitializeColorFix();
      } else if (funcStr.includes('修复版本的applyTitleColor被调用')) {
        console.log('当前使用的是 color-fix.js 中的函数 ⚠');
        // 尝试强制重新初始化
        forceReinitializeColorFix();
      } else {
        console.log('当前使用的是原始的 renderer.js 中的函数 ⚠');
        // 尝试强制重新初始化
        forceReinitializeColorFix();
      }
      
      // 添加一个标记，以便我们知道是否成功被修改
      if (!window.applyTitleColor.source) {
        window.applyTitleColor.source = 'color-test.js';
      }
      
      // 修补函数，添加日志输出
      const originalFunc = window.applyTitleColor;
      window.applyTitleColor = async function() {
        console.log('颜色测试：applyTitleColor 被调用');
        
        // 输出可用的颜色值
        try {
          const titleColorElement = document.querySelector('.title-color-option.selected');
          const bgColorElement = document.querySelector('.bg-color-option.selected');
          const genreColorElement = document.querySelector('.genre-color-option.selected');
          const customTitleColor = document.getElementById('custom-title-color');
          const customBgColor = document.getElementById('custom-bg-color');
          
          console.log('选中的颜色值:', {
            titleColor: titleColorElement ? titleColorElement.dataset.color : '无',
            bgColor: bgColorElement ? bgColorElement.dataset.color : '无',
            customTitleColor: customTitleColor ? customTitleColor.value : '无',
            customBgColor: customBgColor ? customBgColor.value : '无',
            genreColor: genreColorElement ? genreColorElement.dataset.color : '无',
            selectedTitleColor: window.selectedTitleColor || '无',
            selectedBgColor: window.selectedBgColor || '无',
            selectedGenreColor: window.selectedGenreColor || '无'
          });
          
          // 显示DOM元素状态
          const noteTitleElement = document.getElementById('note-title-display');
          console.log('note-title-display 存在:', !!noteTitleElement);
          
          const noteItems = document.querySelectorAll('.note-item');
          console.log('找到笔记条目数量:', noteItems.length);
          
          if (window.currentNoteId) {
            console.log('当前笔记ID:', window.currentNoteId);
            const noteItem = document.querySelector(`.note-item[data-id="${window.currentNoteId}"]`);
            console.log('当前笔记元素存在:', !!noteItem);
          } else {
            console.log('没有选中的笔记ID');
          }
        } catch (err) {
          console.error('颜色测试出错:', err);
        }
        
        // 调用原始函数
        return originalFunc.apply(this, arguments);
      };
      console.log('已添加颜色测试日志代码');
    } else {
      console.log('找不到 applyTitleColor 函数!');
      // 尝试强制重新初始化
      forceReinitializeColorFix();
    }
    
    // 检查按钮元素
    const titleColorConfirmBtn = document.getElementById('title-color-confirm-btn');
    if (titleColorConfirmBtn) {
      console.log('确认按钮元素存在 ✓');
      console.log('确认按钮事件数量:', getEventListeners(titleColorConfirmBtn));
      
      // 确保确认按钮有事件监听器
      if (getEventListeners(titleColorConfirmBtn) === 0) {
        console.log('确认按钮没有事件监听器，尝试重新绑定');
        forceReinitializeColorFix();
      }
    } else {
      console.log('找不到确认按钮元素 ⚠');
    }
    
    console.log('====================================');
  }, 3000); // 等待3秒确保所有脚本都已加载
});

// 强制重新初始化颜色修复
function forceReinitializeColorFix() {
  console.log('尝试强制重新初始化颜色修复...');
  
  // 尝试从color-fix-new.js中重新加载函数
  if (typeof window.initColorFix === 'function') {
    console.log('找到initColorFix函数，执行初始化');
    window.initColorFix();
  } else {
    console.log('找不到initColorFix函数，尝试重新加载脚本');
    
    // 创建新的脚本元素
    const script = document.createElement('script');
    script.src = 'color-fix-new.js?' + Date.now(); // 添加时间戳避免缓存
    script.onload = function() {
      console.log('color-fix-new.js 已重新加载');
      
      // 重新加载颜色选择器修复脚本
      const selectorScript = document.createElement('script');
      selectorScript.src = 'color-selector-fix.js?' + Date.now();
      selectorScript.onload = function() {
        console.log('color-selector-fix.js 已重新加载');
      };
      document.head.appendChild(selectorScript);
    };
    document.head.appendChild(script);
  }
  
  // 重新绑定确认按钮事件
  const confirmBtn = document.getElementById('title-color-confirm-btn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', function() {
      console.log('颜色测试：确认按钮被点击（由color-test.js添加的事件）');
      
      // 获取选中的颜色
      window.selectedTitleColor = null;
      window.selectedBgColor = null;
      window.selectedGenreColor = null;
      
      // 获取标题颜色
      const titleColorElement = document.querySelector('.title-color-option.selected');
      if (titleColorElement) {
        window.selectedTitleColor = titleColorElement.dataset.color;
      } else {
        const customTitleColor = document.getElementById('custom-title-color');
        if (customTitleColor && customTitleColor.value) {
          window.selectedTitleColor = customTitleColor.value;
        }
      }
      
      // 获取背景颜色
      const bgColorElement = document.querySelector('.bg-color-option.selected');
      if (bgColorElement) {
        window.selectedBgColor = bgColorElement.dataset.color;
      } else {
        const customBgColor = document.getElementById('custom-bg-color');
        if (customBgColor && customBgColor.value) {
          window.selectedBgColor = customBgColor.value;
        }
      }
      
      // 获取文体类型颜色
      const genreColorElement = document.querySelector('.genre-color-option.selected');
      if (genreColorElement) {
        window.selectedGenreColor = genreColorElement.dataset.color;
      } else {
        const customGenreColor = document.getElementById('custom-genre-color');
        if (customGenreColor && customGenreColor.value) {
          window.selectedGenreColor = customGenreColor.value;
        }
      }
      
      console.log(`确认颜色 - 标题: ${window.selectedTitleColor}, 背景: ${window.selectedBgColor}, 文体类型: ${window.selectedGenreColor}`);
      
      if (typeof window.applyTitleColor === 'function') {
        window.applyTitleColor();
      } else {
        console.error('找不到applyTitleColor函数');
      }
    });
    console.log('已重新绑定确认按钮事件');
  }
}

// 辅助函数：获取元素的事件监听器数量 (简化版)
function getEventListeners(element) {
  if (!element) return 0;
  let count = 0;
  
  // 常见的事件类型
  const eventTypes = ['click', 'change', 'input', 'focus', 'blur', 'mousedown', 'mouseup'];
  
  // 尝试克隆元素测试是否有事件
  try {
    const clone = element.cloneNode(true);
    if (element.parentNode) {
      // 如果有一个父元素，我们可以尝试通过替换来检测事件
      const parent = element.parentNode;
      const nextSibling = element.nextSibling;
      
      parent.removeChild(element);
      count++; // 假设至少有一个事件监听器
      
      // 恢复元素
      if (nextSibling) {
        parent.insertBefore(element, nextSibling);
      } else {
        parent.appendChild(element);
      }
    }
  } catch (e) {
    console.error('获取事件监听器数量时出错:', e);
  }
  
  return count;
} 