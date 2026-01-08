// 视频区域裁剪模块

let cropCanvas = null;
let cropCtx = null;
let cropVideoElement = null;
let cropVideoPlayer = null;
let cropStartX = 0, cropStartY = 0, cropEndX = 0, cropEndY = 0;
let isCropDragging = false;
let cropImgWidth = 0, cropImgHeight = 0;
let currentCropVideoPath = null;

// 拖动调整相关变量
let isDraggingResize = false;
let resizeHandle = null; // 'tl', 'tr', 'bl', 'br', 't', 'r', 'b', 'l', 'move'
let resizeStartX = 0, resizeStartY = 0;
let originalRect = { x: 0, y: 0, w: 0, h: 0 };
const handleSize = 8; // 控制点大小
const edgeThreshold = 5; // 边缘判定阈值

/**
 * 初始化裁剪功能
 */
function initCropModule() {
    cropCanvas = document.getElementById('cropCanvas');
    if (!cropCanvas) return;
    
    cropCtx = cropCanvas.getContext('2d');
    cropVideoElement = document.createElement('video');
    cropVideoPlayer = document.getElementById('cropVideoPlayer');
    
    // 初始化视频播放器
    initCropVideoPlayer();
    
    // 监听视频选择变化
    const videoSelect = document.getElementById('existingVideoSelectForCrop');
    if (videoSelect) {
        videoSelect.addEventListener('change', handleCropVideoSelect);
    }
    
    // 监听新上传的视频
    const videoFile = document.getElementById('cropVideoFile');
    if (videoFile) {
        videoFile.addEventListener('change', handleCropVideoFileUpload);
    }
    
    // 上传视频按钮
    const uploadBtn = document.getElementById('uploadCropVideoBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', handleUploadCropVideo);
    }
    
    // 刷新视频列表
    const refreshBtn = document.getElementById('refreshVideoListForCropBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshCropVideoList);
    }
    
    // Canvas 鼠标事件
    if (cropCanvas) {
        cropCanvas.addEventListener('mousedown', handleCropMouseDown);
        cropCanvas.addEventListener('mousemove', handleCropMouseMove);
        cropCanvas.addEventListener('mouseup', handleCropMouseUp);
        cropCanvas.addEventListener('mouseleave', handleCropMouseUp);
    }
    
    // 手动输入参数事件
    const cropXInput = document.getElementById('cropX');
    const cropYInput = document.getElementById('cropY');
    const cropWidthInput = document.getElementById('cropWidth');
    const cropHeightInput = document.getElementById('cropHeight');
    
    if (cropXInput) cropXInput.addEventListener('input', handleManualInput);
    if (cropYInput) cropYInput.addEventListener('input', handleManualInput);
    if (cropWidthInput) cropWidthInput.addEventListener('input', handleManualInput);
    if (cropHeightInput) cropHeightInput.addEventListener('input', handleManualInput);
    
    // 应用裁剪按钮
    const applyCropBtn = document.getElementById('applyCropBtn');
    if (applyCropBtn) {
        applyCropBtn.addEventListener('click', applyCropToVideo);
    }
    
    // 重置裁剪按钮
    const resetCropBtn = document.getElementById('resetCropBtn');
    if (resetCropBtn) {
        resetCropBtn.addEventListener('click', resetCrop);
    }
    
    // 捕捉画面按钮
    const captureBtn = document.getElementById('captureFrameBtn');
    if (captureBtn) {
        captureBtn.addEventListener('click', captureCurrentFrame);
    }
    
    // 设置开始/结束时间按钮
    const setStartBtn = document.getElementById('setCurrentAsStartBtn');
    const setEndBtn = document.getElementById('setCurrentAsEndBtn');
    if (setStartBtn) {
        setStartBtn.addEventListener('click', setCurrentTimeAsStart);
    }
    if (setEndBtn) {
        setEndBtn.addEventListener('click', setCurrentTimeAsEnd);
    }
    
    // 初始化时刷新视频列表
    refreshCropVideoList();
}

/**
 * 初始化视频播放器
 */
function initCropVideoPlayer() {
    if (!cropVideoPlayer) return;
    
    const currentTimeDisplay = document.getElementById('cropCurrentTime');
    const durationDisplay = document.getElementById('cropDuration');
    const progressContainer = document.getElementById('cropProgressContainer');
    const progressBarFill = document.getElementById('cropProgressBarFill');
    
    // 视频时间更新
    cropVideoPlayer.addEventListener('timeupdate', function() {
        const currentTime = cropVideoPlayer.currentTime;
        if (currentTimeDisplay) {
            currentTimeDisplay.textContent = secondsToHMS(currentTime);
        }
        
        // 同步当前时间到定位输入框
        const seekInput = document.getElementById('cropSeekTime');
        if (seekInput) {
            seekInput.value = secondsToHMS(currentTime);
        }
        
        // 更新进度条
        if (cropVideoPlayer.duration && progressBarFill) {
            const progressPercent = (currentTime / cropVideoPlayer.duration) * 100;
            progressBarFill.style.width = progressPercent + '%';
        }
    });
    
    // 视频加载元数据后显示总时长
    cropVideoPlayer.addEventListener('loadedmetadata', function() {
        const duration = cropVideoPlayer.duration;
        if (durationDisplay) {
            durationDisplay.textContent = secondsToHMS(duration);
        }
        // 设置默认结束时间
        const endTimeInput = document.getElementById('cropEndTime');
        if (endTimeInput) {
            endTimeInput.value = secondsToHMS(duration);
        }
    });
    
    // 进度条点击跳转
    if (progressContainer) {
        progressContainer.addEventListener('click', function(e) {
            if (cropVideoPlayer.duration) {
                const rect = this.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                cropVideoPlayer.currentTime = pos * cropVideoPlayer.duration;
            }
        });
        
        // 鼠标悬停显示时间
        progressContainer.addEventListener('mousemove', function(e) {
            if (cropVideoPlayer.duration) {
                const rect = this.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                const hoverTime = pos * cropVideoPlayer.duration;
                
                const hoverTimeDisplay = document.getElementById('cropHoverTimeDisplay');
                if (hoverTimeDisplay) {
                    hoverTimeDisplay.textContent = secondsToHMS(hoverTime);
                    hoverTimeDisplay.style.left = (e.clientX - rect.left - 30) + 'px';
                    hoverTimeDisplay.style.display = 'block';
                }
            }
        });
        
        progressContainer.addEventListener('mouseleave', function() {
            const hoverTimeDisplay = document.getElementById('cropHoverTimeDisplay');
            if (hoverTimeDisplay) {
                hoverTimeDisplay.style.display = 'none';
            }
        });
    }
    
    // 播放/暂停按钮
    const playPauseBtn = document.getElementById('cropPlayPauseBtn');
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', function() {
            if (cropVideoPlayer.paused) {
                cropVideoPlayer.play();
            } else {
                cropVideoPlayer.pause();
            }
        });
    }
    
    // 定位按钮
    const seekBtn = document.getElementById('cropSeekBtn');
    if (seekBtn) {
        seekBtn.addEventListener('click', function() {
            const seekInput = document.getElementById('cropSeekTime');
            if (seekInput) {
                const timeStr = seekInput.value;
                const seconds = hmsToSeconds(timeStr);
                cropVideoPlayer.currentTime = seconds;
            }
        });
    }
}

/**
 * 刷新视频列表
 */
function refreshCropVideoList() {
    fetch('/list_upload_videos')
    .then(response => response.json())
    .then(data => {
        const selectElement = document.getElementById('existingVideoSelectForCrop');
        if (!selectElement) return;
        
        const defaultOption = selectElement.options[0];
        selectElement.innerHTML = '';
        selectElement.appendChild(defaultOption);
        
        if (data.files) {
            data.files.forEach(file => {
                const option = document.createElement('option');
                option.value = file.path;
                try {
                    option.textContent = `${decodeURIComponent(escape(file.name))} (${file.size})`;
                } catch (e) {
                    option.textContent = `${file.name} (${file.size})`;
                }
                selectElement.appendChild(option);
            });
        }
    })
    .catch(error => {
        console.error('刷新视频列表时出错:', error);
    });
}

/**
 * 处理从下拉框选择视频
 */
function handleCropVideoSelect(e) {
    const videoPath = e.target.value;
    if (videoPath) {
        currentCropVideoPath = videoPath;
        loadVideoForCrop(videoPath);
        // 也加载到播放器
        loadVideoToPlayer(videoPath);
    }
}

/**
 * 处理从文件上传视频
 */
function handleCropVideoFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        currentCropVideoPath = null;
        // 加载到播放器
        if (cropVideoPlayer) {
            cropVideoPlayer.src = url;
            cropVideoPlayer.play().catch(err => console.log('自动播放失败:', err));
        }
    }
}

/**
 * 上传视频
 */
function handleUploadCropVideo() {
    const fileInput = document.getElementById('cropVideoFile');
    if (!fileInput || fileInput.files.length === 0) {
        alert('请先选择视频文件');
        return;
    }
    
    const formData = new FormData();
    formData.append('video', fileInput.files[0]);
    
    fetch('/upload_video', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('上传失败: ' + data.error);
        } else {
            currentCropVideoPath = data.filepath;
            alert('视频上传成功');
            refreshCropVideoList();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('上传失败: ' + error);
    });
}

/**
 * 加载视频用于裁剪（从服务器路径）
 */
function loadVideoForCrop(videoPath) {
    const fileName = videoPath.split('/').pop();
    const videoUrl = `/static/uploads/${encodeURIComponent(fileName)}`;
    
    cropVideoElement.preload = 'metadata';
    cropVideoElement.src = videoUrl;
    cropVideoElement.onloadedmetadata = () => {
        cropVideoElement.currentTime = 0;
    };
    cropVideoElement.onerror = () => {
        console.error('视频加载失败');
    };
}

/**
 * 加载视频到播放器
 */
function loadVideoToPlayer(videoPath) {
    const fileName = videoPath.split('/').pop();
    const videoUrl = `/static/uploads/${encodeURIComponent(fileName)}`;
    
    if (cropVideoPlayer) {
        cropVideoPlayer.src = videoUrl;
        cropVideoPlayer.play().catch(err => console.log('自动播放失败:', err));
    }
}

/**
 * 捕捉当前画面到 Canvas
 */
function captureCurrentFrame() {
    if (!cropVideoPlayer || cropVideoPlayer.readyState < 2) {
        alert('请先加载视频');
        return;
    }
    
    drawVideoFrameToCanvas();
}

/**
 * 绘制视频帧到 Canvas
 */
function drawVideoFrameToCanvas() {
    cropImgWidth = cropVideoPlayer.videoWidth;
    cropImgHeight = cropVideoPlayer.videoHeight;
    
    // 设置 Canvas 尺寸
    const maxWidth = 800;
    const maxHeight = 450;
    let scale = 1;
    
    if (cropImgWidth > maxWidth || cropImgHeight > maxHeight) {
        scale = Math.min(maxWidth / cropImgWidth, maxHeight / cropImgHeight);
    }
    
    cropCanvas.width = cropImgWidth * scale;
    cropCanvas.height = cropImgHeight * scale;
    
    cropCtx.drawImage(cropVideoPlayer, 0, 0, cropCanvas.width, cropCanvas.height);
    
    // 显示原始尺寸
    const resolutionSpan = document.getElementById('originalResolution');
    if (resolutionSpan) {
        resolutionSpan.textContent = `${cropImgWidth} x ${cropImgHeight}`;
    }
    
    // 重置裁剪区域
    resetCrop();
}

/**
 * Canvas 鼠标按下事件
 */
function handleCropMouseDown(e) {
    const rect = cropCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 获取当前裁剪框
    const [x, y, w, h] = getCropRect();
    
    // 检查是否点击在控制点或边缘上
    resizeHandle = getResizeHandle(mouseX, mouseY, x, y, w, h);
    
    if (resizeHandle) {
        // 开始拖动调整
        isDraggingResize = true;
        resizeStartX = mouseX;
        resizeStartY = mouseY;
        originalRect = { x, y, w, h };
    } else {
        // 开始新框选
        isCropDragging = true;
        cropStartX = mouseX;
        cropStartY = mouseY;
    }
}

/**
 * Canvas 鼠标移动事件
 */
function handleCropMouseMove(e) {
    const rect = cropCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    if (isDraggingResize) {
        // 拖动调整裁剪框
        handleResize(mouseX, mouseY);
        redrawCrop();
    } else if (isCropDragging) {
        // 框选新区域
        cropEndX = mouseX;
        cropEndY = mouseY;
        redrawCrop();
    } else {
        // 更新鼠标样式
        const [x, y, w, h] = getCropRect();
        const handle = getResizeHandle(mouseX, mouseY, x, y, w, h);
        updateCursor(handle);
    }
}

/**
 * Canvas 鼠标松开事件
 */
function handleCropMouseUp(e) {
    if (isDraggingResize) {
        isDraggingResize = false;
        resizeHandle = null;
        updateCropParams();
        updateInputFields();
    } else if (isCropDragging) {
        isCropDragging = false;
        updateCropParams();
        updateInputFields();
    }
}

/**
 * 重绘裁剪区域
 */
function redrawCrop() {
    if (!cropVideoPlayer || cropVideoPlayer.readyState < 2) return;
    
    // 清空并重绘视频帧
    cropCtx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
    cropCtx.drawImage(cropVideoPlayer, 0, 0, cropCanvas.width, cropCanvas.height);
    
    // 获取裁剪矩形
    const [x, y, w, h] = getCropRect();
    
    // 绘制裁剪框
    cropCtx.strokeStyle = 'lime';
    cropCtx.lineWidth = 2;
    cropCtx.strokeRect(x, y, w, h);
    
    // 半透明遮罩（裁剪区域外）
    cropCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    cropCtx.fillRect(0, 0, cropCanvas.width, y); // 上
    cropCtx.fillRect(0, y, x, h); // 左
    cropCtx.fillRect(x + w, y, cropCanvas.width - x - w, h); // 右
    cropCtx.fillRect(0, y + h, cropCanvas.width, cropCanvas.height - y - h); // 下
    
    // 绘制控制点
    drawResizeHandles(x, y, w, h);
    
    // 显示参数
    const scaleX = cropImgWidth / cropCanvas.width;
    const scaleY = cropImgHeight / cropCanvas.height;
    const actualX = Math.round(x * scaleX);
    const actualY = Math.round(y * scaleY);
    const actualW = Math.round(w * scaleX);
    const actualH = Math.round(h * scaleY);
    
    const paramsSpan = document.getElementById('cropParams');
    if (paramsSpan) {
        paramsSpan.textContent = `x=${actualX} y=${actualY} w=${actualW} h=${actualH}`;
    }
}

/**
 * 绘制控制点
 */
function drawResizeHandles(x, y, w, h) {
    const handles = [
        { x: x, y: y },           // 左上
        { x: x + w, y: y },       // 右上
        { x: x, y: y + h },       // 左下
        { x: x + w, y: y + h },   // 右下
        { x: x + w/2, y: y },     // 上中
        { x: x + w/2, y: y + h }, // 下中
        { x: x, y: y + h/2 },     // 左中
        { x: x + w, y: y + h/2 }  // 右中
    ];
    
    cropCtx.fillStyle = 'white';
    cropCtx.strokeStyle = 'lime';
    cropCtx.lineWidth = 2;
    
    handles.forEach(handle => {
        cropCtx.fillRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
        cropCtx.strokeRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
    });
}

/**
 * 获取裁剪矩形坐标
 */
function getCropRect() {
    const x = Math.min(cropStartX, cropEndX);
    const y = Math.min(cropStartY, cropEndY);
    const w = Math.abs(cropEndX - cropStartX);
    const h = Math.abs(cropEndY - cropStartY);
    return [Math.round(x), Math.round(y), Math.round(w), Math.round(h)];
}

/**
 * 更新裁剪参数显示
 */
function updateCropParams() {
    const [x, y, w, h] = getCropRect();
    const scaleX = cropImgWidth / cropCanvas.width;
    const scaleY = cropImgHeight / cropCanvas.height;
    const actualX = Math.round(x * scaleX);
    const actualY = Math.round(y * scaleY);
    const actualW = Math.round(w * scaleX);
    const actualH = Math.round(h * scaleY);
    
    const paramsSpan = document.getElementById('cropParams');
    if (paramsSpan) {
        paramsSpan.textContent = `x=${actualX} y=${actualY} w=${actualW} h=${actualH}`;
    }
}

/**
 * 应用裁剪到视频
 */
function applyCropToVideo() {
    if (!currentCropVideoPath) {
        alert('请先选择一个视频文件');
        return;
    }
    
    const [x, y, w, h] = getCropRect();
    if (w === 0 || h === 0) {
        alert('请先捕捉画面并框选裁剪区域');
        return;
    }
    
    // 计算实际坐标
    const scaleX = cropImgWidth / cropCanvas.width;
    const scaleY = cropImgHeight / cropCanvas.height;
    const actualX = Math.round(x * scaleX);
    const actualY = Math.round(y * scaleY);
    let actualW = Math.round(w * scaleX);
    let actualH = Math.round(h * scaleY);
    
    // 确保宽高是偶数（FFmpeg 要求）
    if (actualW % 2 !== 0) actualW -= 1;
    if (actualH % 2 !== 0) actualH -= 1;
    
    // 获取时间段设置
    const startTimeInput = document.getElementById('cropStartTime');
    const endTimeInput = document.getElementById('cropEndTime');
    const startTime = startTimeInput ? hmsToSeconds(startTimeInput.value) : 0;
    const endTime = endTimeInput ? hmsToSeconds(endTimeInput.value) : 0;
    
    // 显示处理状态
    const resultBox = document.getElementById('cropResult');
    if (resultBox) {
        resultBox.textContent = '正在处理视频裁剪...';
    }
    
    // 发送裁剪请求
    fetch('/crop_video_with_time', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            video_path: currentCropVideoPath,
            x: actualX,
            y: actualY,
            width: actualW,
            height: actualH,
            start_time: startTime,
            end_time: endTime
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            if (resultBox) resultBox.textContent = '裁剪失败: ' + data.error;
        } else {
            if (resultBox) resultBox.textContent = data.result;
            // 刷新输出文件列表
            updateCropOutputFilesList();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (resultBox) resultBox.textContent = '裁剪失败: ' + error;
    });
}

/**
 * 重置裁剪区域
 */
function resetCrop() {
    cropStartX = 0;
    cropStartY = 0;
    cropEndX = cropCanvas.width;
    cropEndY = cropCanvas.height;
    redrawCrop();
    updateInputFields();
}

/**
 * 获取拖动控制点
 */
function getResizeHandle(mouseX, mouseY, x, y, w, h) {
    const corners = [
        { name: 'tl', x: x, y: y },
        { name: 'tr', x: x + w, y: y },
        { name: 'bl', x: x, y: y + h },
        { name: 'br', x: x + w, y: y + h }
    ];
    
    // 检查角点
    for (const corner of corners) {
        if (Math.abs(mouseX - corner.x) <= handleSize && Math.abs(mouseY - corner.y) <= handleSize) {
            return corner.name;
        }
    }
    
    // 检查边缘
    if (Math.abs(mouseY - y) <= edgeThreshold && mouseX >= x && mouseX <= x + w) return 't';
    if (Math.abs(mouseY - (y + h)) <= edgeThreshold && mouseX >= x && mouseX <= x + w) return 'b';
    if (Math.abs(mouseX - x) <= edgeThreshold && mouseY >= y && mouseY <= y + h) return 'l';
    if (Math.abs(mouseX - (x + w)) <= edgeThreshold && mouseY >= y && mouseY <= y + h) return 'r';
    
    // 检查是否在裁剪框内（移动）
    if (mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h) {
        return 'move';
    }
    
    return null;
}

/**
 * 处理拖动调整
 */
function handleResize(mouseX, mouseY) {
    const dx = mouseX - resizeStartX;
    const dy = mouseY - resizeStartY;
    
    let newX = originalRect.x;
    let newY = originalRect.y;
    let newW = originalRect.w;
    let newH = originalRect.h;
    
    switch (resizeHandle) {
        case 'tl': // 左上角
            newX = originalRect.x + dx;
            newY = originalRect.y + dy;
            newW = originalRect.w - dx;
            newH = originalRect.h - dy;
            break;
        case 'tr': // 右上角
            newY = originalRect.y + dy;
            newW = originalRect.w + dx;
            newH = originalRect.h - dy;
            break;
        case 'bl': // 左下角
            newX = originalRect.x + dx;
            newW = originalRect.w - dx;
            newH = originalRect.h + dy;
            break;
        case 'br': // 右下角
            newW = originalRect.w + dx;
            newH = originalRect.h + dy;
            break;
        case 't': // 上边
            newY = originalRect.y + dy;
            newH = originalRect.h - dy;
            break;
        case 'b': // 下边
            newH = originalRect.h + dy;
            break;
        case 'l': // 左边
            newX = originalRect.x + dx;
            newW = originalRect.w - dx;
            break;
        case 'r': // 右边
            newW = originalRect.w + dx;
            break;
        case 'move': // 移动
            newX = originalRect.x + dx;
            newY = originalRect.y + dy;
            break;
    }
    
    // 限制在 canvas 范围内
    newX = Math.max(0, Math.min(newX, cropCanvas.width - newW));
    newY = Math.max(0, Math.min(newY, cropCanvas.height - newH));
    newW = Math.max(10, Math.min(newW, cropCanvas.width - newX));
    newH = Math.max(10, Math.min(newH, cropCanvas.height - newY));
    
    // 更新裁剪框坐标
    cropStartX = newX;
    cropStartY = newY;
    cropEndX = newX + newW;
    cropEndY = newY + newH;
}

/**
 * 更新鼠标样式
 */
function updateCursor(handle) {
    if (!cropCanvas) return;
    
    const cursorMap = {
        'tl': 'nwse-resize',
        'tr': 'nesw-resize',
        'bl': 'nesw-resize',
        'br': 'nwse-resize',
        't': 'ns-resize',
        'b': 'ns-resize',
        'l': 'ew-resize',
        'r': 'ew-resize',
        'move': 'move'
    };
    
    cropCanvas.style.cursor = handle ? cursorMap[handle] : 'crosshair';
}

/**
 * 更新输入框数值
 */
function updateInputFields() {
    const [x, y, w, h] = getCropRect();
    const scaleX = cropImgWidth / cropCanvas.width;
    const scaleY = cropImgHeight / cropCanvas.height;
    const actualX = Math.round(x * scaleX);
    const actualY = Math.round(y * scaleY);
    const actualW = Math.round(w * scaleX);
    const actualH = Math.round(h * scaleY);
    
    const cropXInput = document.getElementById('cropX');
    const cropYInput = document.getElementById('cropY');
    const cropWidthInput = document.getElementById('cropWidth');
    const cropHeightInput = document.getElementById('cropHeight');
    
    if (cropXInput) cropXInput.value = actualX;
    if (cropYInput) cropYInput.value = actualY;
    if (cropWidthInput) cropWidthInput.value = actualW;
    if (cropHeightInput) cropHeightInput.value = actualH;
}

/**
 * 处理手动输入
 */
function handleManualInput() {
    const cropXInput = document.getElementById('cropX');
    const cropYInput = document.getElementById('cropY');
    const cropWidthInput = document.getElementById('cropWidth');
    const cropHeightInput = document.getElementById('cropHeight');
    
    if (!cropXInput || !cropYInput || !cropWidthInput || !cropHeightInput) return;
    if (!cropImgWidth || !cropImgHeight) return;
    
    const x = parseInt(cropXInput.value) || 0;
    const y = parseInt(cropYInput.value) || 0;
    const w = parseInt(cropWidthInput.value) || 0;
    const h = parseInt(cropHeightInput.value) || 0;
    
    // 转换回 canvas 坐标
    const scaleX = cropCanvas.width / cropImgWidth;
    const scaleY = cropCanvas.height / cropImgHeight;
    
    cropStartX = x * scaleX;
    cropStartY = y * scaleY;
    cropEndX = (x + w) * scaleX;
    cropEndY = (y + h) * scaleY;
    
    redrawCrop();
}

/**
 * 设置当前时间为开始时间
 */
function setCurrentTimeAsStart() {
    if (!cropVideoPlayer) return;
    const startTimeInput = document.getElementById('cropStartTime');
    if (startTimeInput) {
        startTimeInput.value = secondsToHMS(cropVideoPlayer.currentTime);
    }
}

/**
 * 设置当前时间为结束时间
 */
function setCurrentTimeAsEnd() {
    if (!cropVideoPlayer) return;
    const endTimeInput = document.getElementById('cropEndTime');
    if (endTimeInput) {
        endTimeInput.value = secondsToHMS(cropVideoPlayer.currentTime);
    }
}

/**
 * 更新裁剪输出文件列表
 */
function updateCropOutputFilesList() {
    fetch('/list_output_files')
    .then(response => response.json())
    .then(data => {
        const listElement = document.getElementById('cropOutputFilesList');
        if (listElement) {
            listElement.innerHTML = '';
            if (data.files) {
                data.files.forEach(file => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <span>${file.name} (${file.size})</span>
                        <a href="/download/${file.name}" target="_blank">下载</a>
                    `;
                    listElement.appendChild(listItem);
                });
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

/**
 * 将秒数转换为 HH:MM:SS 格式
 */
function secondsToHMS(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}

/**
 * 将HH:MM:SS格式转换为秒数
 */
function hmsToSeconds(str) {
    const timeStr = String(str || '').trim();
    if (!timeStr) return 0;
    
    const parts = timeStr.split(':');
    let seconds = 0;
    
    if (parts.length === 3) {
        seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
    } else if (parts.length === 2) {
        seconds = parseInt(parts[0]) * 60 + parseFloat(parts[1]);
    } else if (parts.length === 1) {
        seconds = parseFloat(parts[0]);
    }
    return isNaN(seconds) ? 0 : seconds;
}

// 导出函数供其他模块使用
export {
    initCropModule,
    resetCrop
};
