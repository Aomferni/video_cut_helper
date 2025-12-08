// 标签页管理模块

/**
 * 初始化标签页切换功能
 */
function initTabs() {
    // 只选择带有data-tab属性的标签按钮，避免与使用onclick的按钮冲突
    const tabButtons = document.querySelectorAll('.tab-button[data-tab]');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有活动状态
            // 同样只处理带有data-tab属性的按钮
            document.querySelectorAll('.tab-button[data-tab]').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            // 设置当前按钮为活动状态
            this.classList.add('active');
            // 显示对应的内容区域
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// 导出函数供外部使用
export { initTabs };