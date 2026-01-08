// 主入口文件 - 整合所有模块

// 导入所有模块
import { initTabs } from './modules/tabs.js';
import { 
    initCuttingTab, 
    initCuttingPlayer,
    refreshVideoListForCutting,
    playVideoFromPath,
    playUploadedVideo,
    calculateAllDurations,
    updateSelectAllCheckbox,
    updateClipTable,
    updateTable,
    setActiveCell,
    calculateDuration,
    secondsToHMS,
    hmsToSeconds,
    exportToExcel,
    updateRecordSelectAllCheckbox,
    startCutting,
    updateCutOutputFilesList
} from './modules/cutting.js';

import { 
    initPlayerTab,
    refreshVideoListForPlayer,
    showLocalVideoInfo,
    showUploadedVideoInfo,
    initRecordTimeTable,
    recordCurrentTime,
    playActiveTime,
    calculateAllRecordDurations,
    updateRecordTable,
    importRecordExcel,
    exportRecordToExcel,
    syncToClipTable
} from './modules/player.js';

import { 
    initConcatTab,
    refreshVideoListForConcat,
    updateUploadedVideosList,
    initDragAndDrop,
    updateVideoOrder,
    concatVideos,
    updateOutputFilesList
} from './modules/concat.js';

import { 
    initCompressTab,
    refreshVideoListForCompress,
    initCompressPlayer,
    compressVideo,
    updateCompressOutputFilesList
} from './modules/compress.js';

// 导入PDF模块
import { initPdfTab } from './modules/pdf.js';

// 导入图像批处理模块
import { initBatchProcessTab } from './modules/batch_process.js';

// 导入框选裁剪模块
import { initCropModule } from './modules/crop.js';

// 全局变量
let activeCell = null;
let videoElement = null;
let uploadedVideoPath = null;
let uploadedExcelData = null;
let uploadedConcatVideos = [];
let uploadedCompressVideoPath = null;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化标签页
    initTabs();
    
    // 初始化视频剪辑功能
    initCuttingTab();
    
    // 初始化视频播放器功能
    initPlayerTab();
    
    // 初始化视频拼接功能
    initConcatTab();
    
    // 初始化视频压缩功能
    initCompressTab();
    
    // 初始化PDF功能
    initPdfTab();
    
    // 初始化图像批处理功能
    initBatchProcessTab();
    
    // 初始化框选裁剪功能
    initCropModule();
    
    // 定期更新输出文件列表
    setInterval(function() {
        updateOutputFilesList();
        updateCompressOutputFilesList();
    }, 5000);
    
    // 添加点击表格外取消激活状态的事件监听器
    document.addEventListener('click', function(event) {
        // 检查点击是否在表格内部
        const isInClipTable = event.target.closest && event.target.closest('#clipTable');
        const isInRecordTable = event.target.closest && event.target.closest('#player table');
        
        // 如果点击不在表格内部，则取消激活状态
        if (!isInClipTable && !isInRecordTable) {
            // 移除之前激活单元格的高亮
            if (activeCell) {
                activeCell.classList.remove('active-cell');
                activeCell = null;
            }
        }
    });
});