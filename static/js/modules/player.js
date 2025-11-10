// 视频播放器模块

// 全局变量
let activeCell = null;

/**
 * 初始化视频播放器标签页
 */
function initPlayerTab() {
    // 页面加载时刷新视频列表
    refreshVideoListForPlayer();
    const videoPlayer = document.getElementById('videoPlayer');
    const currentTimeDisplay = document.getElementById('currentTime');
    const durationDisplay = document.getElementById('duration');
    // 获取进度条元素
    const progressContainer = document.getElementById('progressContainer');
    const progressBarFill = document.getElementById('progressBarFill');
    // 修改视频播放器部分，不上传视频到服务器，直接本地播放
    document.getElementById('playerVideoFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // 直接创建本地URL播放，不上传到服务器
            const url = URL.createObjectURL(file);
            videoPlayer.src = url;
            // 自动播放视频
            videoPlayer.play();
            // 显示视频信息（仅显示本地信息，不调用服务器接口）
            setTimeout(() => {
                showLocalVideoInfo(file);
            }, 100);
            // 清除已选择的现有文件
            document.getElementById('existingVideoSelectForPlayer').value = '';
        }
    });
    // 从已上传文件中选择视频（视频打标页面）
    document.getElementById('existingVideoSelectForPlayer').addEventListener('change', function(e) {
        const selectedValue = e.target.value;
        if (selectedValue) {
            // 清除文件选择
            document.getElementById('playerVideoFile').value = '';
            // 播放视频，指定使用视频打标页面的播放器
            playVideoFromPathLocal(selectedValue, 'videoPlayer');
            // 显示视频信息
            showUploadedVideoInfo(selectedValue);
        }
    });
    // 刷新视频列表按钮（视频打标页面）
    document.getElementById('refreshVideoListForPlayerBtn').addEventListener('click', function() {
        refreshVideoListForPlayer();
    });
    // 视频时间更新
    videoPlayer.addEventListener('timeupdate', function() {
        if (videoPlayer.duration) {
            const percent = (videoPlayer.currentTime / videoPlayer.duration) * 100;
            progressBarFill.style.width = percent + '%';
            currentTimeDisplay.textContent = secondsToHMS(videoPlayer.currentTime);
        }
    });
    // 视频加载元数据
    videoPlayer.addEventListener('loadedmetadata', function() {
        durationDisplay.textContent = secondsToHMS(videoPlayer.duration);
    });
    // 点击进度条跳转到指定位置
    progressContainer.addEventListener('click', function(e) {
        if (videoPlayer.duration) {
            const rect = progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            videoPlayer.currentTime = pos * videoPlayer.duration;
        }
    });
    // 鼠标在进度条上移动时显示时间
    progressContainer.addEventListener('mousemove', function(e) {
        if (videoPlayer.duration) {
            const rect = progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            const hoverTime = pos * videoPlayer.duration;
            // 显示时间提示
            const hoverTimeDisplay = document.getElementById('hoverTimeDisplay');
            hoverTimeDisplay.textContent = secondsToHMS(hoverTime);
            // 设置位置
            const hoverPos = e.clientX - rect.left;
            hoverTimeDisplay.style.left = (hoverPos - 30) + 'px';
            hoverTimeDisplay.style.display = 'block';
        }
    });
    // 鼠标离开进度条时隐藏时间显示
    progressContainer.addEventListener('mouseleave', function() {
        const hoverTimeDisplay = document.getElementById('hoverTimeDisplay');
        hoverTimeDisplay.style.display = 'none';
    });
    
    // 添加鼠标滚轮事件监听器，用于精细调整时间
    progressContainer.addEventListener('wheel', function(e) {
        // 阻止页面滚动
        e.preventDefault();
        
        // 检查视频是否已加载
        if (videoPlayer.duration) {
            // 滚轮调整步长（1秒）
            const timeStep = 1;
            
            // 根据滚轮方向调整时间
            if (e.deltaY < 0) {
                // 向上滚动，快进1秒
                videoPlayer.currentTime = Math.min(videoPlayer.currentTime + timeStep, videoPlayer.duration);
            } else {
                // 向下滚动，快退1秒
                videoPlayer.currentTime = Math.max(videoPlayer.currentTime - timeStep, 0);
            }
        }
    });
    
    // 播放/暂停按钮
    document.getElementById('playPauseBtn').addEventListener('click', function() {
        if (videoPlayer.paused) {
            videoPlayer.play();
        } else {
            videoPlayer.pause();
        }
    });
    // 定位按钮
    document.getElementById('seekBtn').addEventListener('click', function() {
        const timeStr = document.getElementById('seekTime').value;
        const seconds = hmsToSeconds(timeStr);
        videoPlayer.currentTime = seconds;
    });
    // 为时间字段添加点击事件
    document.getElementById('startTimeField').addEventListener('click', function() {
        setActiveCell(this);
    });
    document.getElementById('endTimeField').addEventListener('click', function() {
        setActiveCell(this);
    });
    // 为时间字段添加焦点事件
    document.getElementById('startTimeField').addEventListener('focus', function() {
        setActiveCell(this);
    });
    document.getElementById('endTimeField').addEventListener('focus', function() {
        setActiveCell(this);
    });
    // 初始化记录时间点表格功能
    initRecordTimeTable();
}

/**
 * 刷新视频列表（视频打标页面）
 */
function refreshVideoListForPlayer() {
    fetch('/list_upload_videos')
    .then(response => response.json())
    .then(data => {
        const selectElement = document.getElementById('existingVideoSelectForPlayer');
        // 保留默认选项
        const defaultOption = selectElement.options[0];
        selectElement.innerHTML = '';
        selectElement.appendChild(defaultOption);
        // 添加视频文件选项
        data.files.forEach(file => {
            const option = document.createElement('option');
            option.value = file.path;
            option.textContent = `${file.name} (${file.size})`;
            selectElement.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

/**
 * 显示本地视频信息（不上传到服务器）
 */
function showLocalVideoInfo(file) {
    const video = document.getElementById('videoPlayer');
    // 先清空之前的信息
    document.getElementById('videoInfo').textContent = '正在加载视频信息...';
    // 等待视频加载元数据
    const onLoadMetadata = function() {
        const fileSize = (file.size / (1024 * 1024)).toFixed(2); // MB
        const infoText = `文件名: ${file.name}\n文件大小: ${fileSize} MB\n视频时长: ${secondsToHMS(video.duration)}\n分辨率: ${video.videoWidth}x${video.videoHeight}`;
        document.getElementById('videoInfo').textContent = infoText;
        // 移除事件监听器
        video.removeEventListener('loadedmetadata', onLoadMetadata);
    };
    // 如果视频已经加载了元数据
    if (video.readyState >= 1) {
        onLoadMetadata();
    } else {
        // 等待元数据加载完成
        video.addEventListener('loadedmetadata', onLoadMetadata, { once: true });
    }
}

/**
 * 显示已上传视频的信息
 */
function showUploadedVideoInfo(videoPath) {
    fetch('/get_video_info', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({video_path: videoPath})
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            document.getElementById('videoInfo').textContent = '获取视频信息失败: ' + data.error;
        } else {
            const infoText = `文件名: ${data.filename}\n文件大小: ${data.filesize}\n视频时长: ${data.duration}\n分辨率: ${data.resolution}`;
            document.getElementById('videoInfo').textContent = infoText;
        }
    })
    .catch(error => {
        document.getElementById('videoInfo').textContent = '获取视频信息失败: ' + error;
    });
}

/**
 * 初始化记录时间点表格功能
 */
function initRecordTimeTable() {
    // 记录当前时间按钮（现在在快速定位区域）
    const recordTimeBtn = document.getElementById('recordTimeBtn');
    if (recordTimeBtn) {
        recordTimeBtn.addEventListener('click', function() {
            recordCurrentTime();
        });
    }
    // 添加行按钮
    document.getElementById('addRecordRowBtn').addEventListener('click', function() {
        const tbody = document.querySelector('#recordTable tbody');
        const newRow = tbody.insertRow();
        // 添加复选框单元格
        const checkboxCell = newRow.insertCell(0);
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'record-row-checkbox';
        checkboxCell.appendChild(checkbox);
        // 添加开始时间单元格
        const startTimeCell = newRow.insertCell(1);
        startTimeCell.className = 'editable';
        startTimeCell.contentEditable = true;
        startTimeCell.textContent = '00:00:00';
        // 添加结束时间单元格
        const endTimeCell = newRow.insertCell(2);
        endTimeCell.className = 'editable';
        endTimeCell.contentEditable = true;
        endTimeCell.textContent = '00:00:00';
        // 添加标题单元格
        const titleCell = newRow.insertCell(3);
        titleCell.className = 'editable';
        titleCell.contentEditable = true;
        titleCell.textContent = '';
        // 添加时长单元格
        const durationCell = newRow.insertCell(4);
        durationCell.className = 'duration-cell';
        durationCell.textContent = '0';
        // 添加操作单元格
        const actionCell = newRow.insertCell(5);
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-record-row-btn';
        deleteBtn.textContent = '删除';
        deleteBtn.addEventListener('click', function() {
            if (confirm('确定要删除这一行吗？')) {
                tbody.removeChild(newRow);
                updateRecordSelectAllCheckbox();
            }
        });
        actionCell.appendChild(deleteBtn);
        // 添加事件监听器
        startTimeCell.addEventListener('click', function() {
            setActiveCell(this);
        });
        endTimeCell.addEventListener('click', function() {
            setActiveCell(this);
        });
        titleCell.addEventListener('click', function() {
            setActiveCell(this);
        });
        // 添加时间变化监听器以自动计算时长
        startTimeCell.addEventListener('input', function() {
            const duration = calculateDuration(startTimeCell.textContent, endTimeCell.textContent);
            durationCell.textContent = duration;
        });
        endTimeCell.addEventListener('input', function() {
            const duration = calculateDuration(startTimeCell.textContent, endTimeCell.textContent);
            durationCell.textContent = duration;
        });
        // 添加复选框事件监听器
        checkbox.addEventListener('change', function() {
            updateRecordSelectAllCheckbox();
        });
    });
    // 删除选中行按钮
    document.getElementById('deleteSelectedRecordRowsBtn').addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('#recordTable tbody .record-row-checkbox:checked');
        if (checkboxes.length === 0) {
            alert('请先选择要删除的行');
            return;
        }
        if (confirm(`确定要删除选中的${checkboxes.length}行吗？`)) {
            // 从后往前删除，避免索引问题
            const rows = [];
            checkboxes.forEach(checkbox => {
                rows.push(checkbox.closest('tr'));
            });
            rows.forEach(row => {
                row.remove();
            });
            // 更新全选复选框状态
            updateRecordSelectAllCheckbox();
        }
    });
    // 全选复选框
    document.getElementById('selectRecordAllCheckbox').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('#recordTable tbody .record-row-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });
    // 为现有表格单元格添加点击事件
    document.querySelectorAll('#recordTable .editable').forEach(cell => {
        cell.addEventListener('click', function() {
            setActiveCell(this);
        });
    });
    // 为现有的删除按钮添加事件监听器
    document.querySelectorAll('#recordTable .delete-record-row-btn').forEach(button => {
        button.addEventListener('click', function() {
            if (confirm('确定要删除这一行吗？')) {
                const row = this.closest('tr');
                row.remove();
                updateRecordSelectAllCheckbox();
            }
        });
    });
    
    // 为跳转播放按钮添加事件监听器
    const playRecordActiveTimeBtn = document.getElementById('playRecordActiveTimeBtn');
    if (playRecordActiveTimeBtn) {
        playRecordActiveTimeBtn.addEventListener('click', function() {
            playActiveTime();
        });
    }
    
    // 为计算所有剪辑段时长按钮添加事件监听器
    const calculateRecordDurationBtn = document.getElementById('calculateRecordDurationBtn');
    if (calculateRecordDurationBtn) {
        calculateRecordDurationBtn.addEventListener('click', function() {
            calculateAllRecordDurations();
        });
    }
    
    // 为Excel导入按钮添加事件监听器
    const importRecordExcelBtn = document.getElementById('importRecordExcelBtn');
    if (importRecordExcelBtn) {
        importRecordExcelBtn.addEventListener('click', function() {
            importRecordExcel();
        });
    }
    
    // 为Excel导出按钮添加事件监听器
    const exportRecordExcelBtn = document.getElementById('exportRecordExcelBtn');
    if (exportRecordExcelBtn) {
        exportRecordExcelBtn.addEventListener('click', function() {
            exportRecordToExcel();
        });
    }
    
    // 为同步到视频剪辑页按钮添加事件监听器
    const syncToClipTableBtn = document.getElementById('syncToClipTableBtn');
    if (syncToClipTableBtn) {
        syncToClipTableBtn.addEventListener('click', function() {
            syncToClipTable();
        });
    }
}

/**
 * 记录当前时间
 */
function recordCurrentTime() {
    const videoPlayer = document.getElementById('videoPlayer');
    if (videoPlayer && videoPlayer.currentTime && activeCell) {
        const currentTime = secondsToHMS(videoPlayer.currentTime);
        activeCell.textContent = currentTime;
        // 触发输入事件以更新时长
        const row = activeCell.closest('tr');
        if (row) {
            const cells = row.querySelectorAll('.editable');
            if (cells.length >= 2) {
                const startTimeCell = cells[0];
                const endTimeCell = cells[1];
                const durationCell = row.querySelector('.duration-cell');
                if (durationCell) {
                    const duration = calculateDuration(startTimeCell.textContent, endTimeCell.textContent);
                    durationCell.textContent = duration;
                }
            }
        }
    } else if (!activeCell) {
        alert('请先点击激活一个时间单元格（开始时间或结束时间）');
    }
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
    // 确保输入是字符串
    const timeStr = String(str || '').trim();
    if (!timeStr) return 0;
    // 分割时间部分
    const parts = timeStr.split(':');
    let seconds = 0;
    if (parts.length === 3) {
        // HH:MM:SS 格式
        seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
    } else if (parts.length === 2) {
        // MM:SS 格式
        seconds = parseInt(parts[0]) * 60 + parseFloat(parts[1]);
    } else if (parts.length === 1) {
        // SS 格式
        seconds = parseFloat(parts[0]);
    }
    return isNaN(seconds) ? 0 : seconds;
}

/**
 * 计算时长（以0.5分钟为步数）
 */
function calculateDuration(startTimeStr, endTimeStr) {
    const startSeconds = hmsToSeconds(startTimeStr);
    const endSeconds = hmsToSeconds(endTimeStr);
    // 允许开始时间为00:00:00，但结束时间必须大于开始时间
    if (startSeconds > endSeconds) return 0;
    if (startSeconds === endSeconds && startSeconds !== 0) return 0;
    const durationMinutes = (endSeconds - startSeconds) / 60;
    // 以0.5分钟为步数进行四舍五入
    return Math.round(durationMinutes * 2) / 2;
}

/**
 * 导入记录时间点Excel文件
 */
function importRecordExcel() {
    const fileInput = document.getElementById('importRecordExcelFile');
    if (fileInput.files.length === 0) {
        alert('请先选择Excel文件');
        return;
    }
    
    // 显示上传进度条
    const progressContainer = document.getElementById('recordExcelUploadProgressContainer');
    const progressBar = document.getElementById('recordExcelUploadProgress');
    const progressText = document.getElementById('recordExcelUploadProgressText');
    progressContainer.style.display = 'block';
    progressBar.value = 0;
    progressText.textContent = '0%';
    
    // 模拟上传进度（实际项目中应该通过真实的上传过程更新进度）
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 5) + 1;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
        }
        progressBar.value = progress;
        progressText.textContent = progress + '%';
    }, 100);
    
    // 真实的上传逻辑（在模拟进度完成后执行）
    setTimeout(() => {
        const formData = new FormData();
        formData.append('excel', fileInput.files[0]);
        fetch('/upload_excel', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(result => {
            // 隐藏上传进度条
            progressContainer.style.display = 'none';
            clearInterval(interval); // 确保清除定时器
            if (result.error) {
                alert('上传失败: ' + result.error);
            } else {
                // 将服务器返回的数据转换为前端期望的格式
                const tableData = result.data.map(row => {
                    // 获取所有键
                    const keys = result.columns || Object.keys(row);
                    
                    // 查找开始时间、结束时间、剪辑标题列
                    let startTimeCol = null;
                    let endTimeCol = null;
                    let titleCol = null;
                    
                    // 根据列名查找对应的列
                    for (let i = 0; i < keys.length; i++) {
                        const colName = keys[i].toLowerCase();
                        if (!startTimeCol && (colName.includes('开始') || colName.includes('start') || colName.includes('begin'))) {
                            startTimeCol = keys[i];
                        } else if (!endTimeCol && (colName.includes('结束') || colName.includes('end'))) {
                            endTimeCol = keys[i];
                        } else if (!titleCol && (colName.includes('标题') || colName.includes('title') || colName.includes('name'))) {
                            titleCol = keys[i];
                        }
                    }
                    
                    // 如果没有找到特定列名，则按顺序使用前三个列
                    if (!startTimeCol && keys.length > 0) startTimeCol = keys[0];
                    if (!endTimeCol && keys.length > 1) endTimeCol = keys[1];
                    if (!titleCol && keys.length > 2) titleCol = keys[2];
                    
                    // 提取对应列的值
                    return [
                        (startTimeCol && row[startTimeCol]) || '',  // 开始时间
                        (endTimeCol && row[endTimeCol]) || '',      // 结束时间
                        (titleCol && row[titleCol]) || ''           // 剪辑标题
                    ];
                });
                
                // 更新记录时间点表格
                updateRecordTable(tableData);
            }
        })
        .catch(error => {
            // 隐藏上传进度条
            progressContainer.style.display = 'none';
            clearInterval(interval); // 确保清除定时器
            console.error('Error:', error);
            alert('上传失败: ' + error);
        });
    }, 3000); // 3秒后执行真实上传
}

/**
 * 计算所有记录时间点表格行的时长
 */
function calculateAllRecordDurations() {
    const rows = document.querySelectorAll('#recordTable tbody tr');
    let count = 0;
    rows.forEach(row => {
        const cells = row.querySelectorAll('.editable');
        if (cells.length >= 2) {
            const startTimeCell = cells[0];
            const endTimeCell = cells[1];
            const durationCell = row.querySelector('.duration-cell');
            
            if (startTimeCell && endTimeCell && durationCell) {
                const duration = calculateDuration(startTimeCell.textContent, endTimeCell.textContent);
                durationCell.textContent = duration;
                count++;
            }
        }
    });
    alert(`已计算${count}行的时长`);
}

/**
 * 同步记录时间点到视频剪辑表格
 */
function syncToClipTable() {
    // 获取记录时间点表格的所有数据
    const recordRows = document.querySelectorAll('#recordTable tbody tr');
    const clipTableBody = document.querySelector('#clipTable tbody');
    
    if (!clipTableBody) {
        alert('未找到视频剪辑表格');
        return;
    }
    
    // 清空剪辑表格现有内容
    clipTableBody.innerHTML = '';
    
    // 将记录时间点数据复制到剪辑表格
    recordRows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {
            const newRow = clipTableBody.insertRow();
            
            // 添加复选框单元格
            const checkboxCell = newRow.insertCell(0);
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'row-checkbox';
            checkboxCell.appendChild(checkbox);
            
            // 添加开始时间单元格
            const startTimeCell = newRow.insertCell(1);
            startTimeCell.className = 'editable';
            startTimeCell.contentEditable = true;
            startTimeCell.textContent = cells[1].textContent;
            
            // 添加结束时间单元格
            const endTimeCell = newRow.insertCell(2);
            endTimeCell.className = 'editable';
            endTimeCell.contentEditable = true;
            endTimeCell.textContent = cells[2].textContent;
            
            // 添加标题单元格
            const titleCell = newRow.insertCell(3);
            titleCell.className = 'editable';
            titleCell.contentEditable = true;
            titleCell.textContent = cells[3].textContent || `片段${index + 1}`;
            
            // 添加时长单元格
            const durationCell = newRow.insertCell(4);
            durationCell.className = 'duration-cell';
            durationCell.textContent = cells[4].textContent;
            
            // 添加操作单元格
            const actionCell = newRow.insertCell(5);
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-row-btn';
            deleteBtn.textContent = '删除';
            deleteBtn.addEventListener('click', function() {
                if (confirm('确定要删除这一行吗？')) {
                    clipTableBody.removeChild(newRow);
                    // 更新全选复选框状态
                    updateSelectAllCheckbox();
                }
            });
            actionCell.appendChild(deleteBtn);
            
            // 添加事件监听器
            startTimeCell.addEventListener('click', function() {
                setActiveCell(this);
            });
            endTimeCell.addEventListener('click', function() {
                setActiveCell(this);
            });
            titleCell.addEventListener('click', function() {
                setActiveCell(this);
            });
            
            // 添加时间变化监听器以自动计算时长
            startTimeCell.addEventListener('input', function() {
                const duration = calculateDuration(startTimeCell.textContent, endTimeCell.textContent);
                durationCell.textContent = duration;
            });
            endTimeCell.addEventListener('input', function() {
                const duration = calculateDuration(startTimeCell.textContent, endTimeCell.textContent);
                durationCell.textContent = duration;
            });
            
            // 添加复选框事件监听器
            checkbox.addEventListener('change', function() {
                updateSelectAllCheckbox();
            });
        }
    });
    
    // 更新全选复选框状态
    updateSelectAllCheckbox();
    
    // 切换到视频剪辑标签页
    const cuttingTabButton = document.querySelector('.tab-button[data-tab="cutting"]');
    if (cuttingTabButton) {
        cuttingTabButton.click();
    }
    
    alert(`已同步${recordRows.length}行数据到视频剪辑页`);
}

/**
 * 导出记录时间点表格数据为Excel文件
 */
function exportRecordToExcel() {
    // 获取表格数据
    const tableData = [];
    const rows = document.querySelectorAll('#recordTable tbody tr');
    // 添加表头
    tableData.push(['开始时间', '结束时间', '剪辑标题', '时长(分钟)']);
    // 添加数据行
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {
            const rowData = [
                cells[1].textContent,
                cells[2].textContent,
                cells[3].textContent,
                cells[4].textContent
            ];
            tableData.push(rowData);
        }
    });

    // 发送请求到服务器生成Excel文件
    fetch('/export_excel', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ table_data: tableData })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert('导出失败: ' + data.error);
        } else {
            // 提供下载链接
            const downloadLink = document.createElement('a');
            downloadLink.href = '/download/' + data.filename;
            downloadLink.download = data.filename;
            downloadLink.click();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('导出失败: ' + error);
    });
}

/**
 * 更新记录时间点表格
 */
function updateRecordTable(data) {
    updateTable(data, '#recordTable', 'record-row-checkbox', 'delete-record-row-btn');
}

/**
 * 更新记录时间点表格全选复选框状态
 */
function updateRecordSelectAllCheckbox() {
    const allCheckboxes = document.querySelectorAll('#recordTable .record-row-checkbox');
    const checkedCheckboxes = document.querySelectorAll('#recordTable .record-row-checkbox:checked');
    const selectAllCheckbox = document.getElementById('selectRecordAllCheckbox');
    if (allCheckboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCheckboxes.length === allCheckboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedCheckboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

/**
 * 设置激活单元格
 */
function setActiveCell(cell) {
    // 移除之前激活单元格的高亮
    if (activeCell) {
        activeCell.classList.remove('active-cell');
    }
    // 设置新的激活单元格
    activeCell = cell;
    if (activeCell) {
        activeCell.classList.add('active-cell');
    }
}

// 从路径播放视频（本地版本）
function playVideoFromPathLocal(videoPath, targetPlayerId) {
    // 获取文件名
    const fileName = videoPath.split('/').pop();
    // 构造视频文件的访问URL
    // 注意：这需要服务器支持文件访问
    const videoUrl = `/static/uploads/${fileName}`;
    // 确定要播放视频的播放器
    let videoPlayer;
    if (targetPlayerId) {
        videoPlayer = document.getElementById(targetPlayerId);
    } else {
        videoPlayer = document.getElementById('videoPlayer');
    }

    if (videoPlayer) {
        videoPlayer.src = videoUrl;
        // 自动播放视频
        videoPlayer.play().catch(error => {
            console.log('自动播放失败:', error);
            // 如果自动播放失败，至少设置视频源
            videoPlayer.src = videoUrl;
        });
    }
}

/**
 * 跳转到激活时间点播放
 */
function playActiveTime() {
    if (!activeCell) {
        alert('请先点击激活一个时间单元格（开始时间或结束时间）');
        return;
    }
    // 获取激活单元格的时间值
    const timeStr = activeCell.textContent;
    const seconds = hmsToSeconds(timeStr);
    // 获取视频播放器并跳转到指定时间
    const videoPlayer = document.getElementById('videoPlayer') ||
                      document.getElementById('cuttingVideoPlayer') ||
                      document.getElementById('compressVideoPlayer');
    if (videoPlayer) {
        videoPlayer.currentTime = seconds;
        videoPlayer.play();
    }
}

// 导出函数供其他模块使用
export {
    initPlayerTab,
    refreshVideoListForPlayer,
    showLocalVideoInfo,
    showUploadedVideoInfo,
    initRecordTimeTable,
    recordCurrentTime,
    playActiveTime,
    playVideoFromPathLocal,
    calculateAllRecordDurations,
    updateRecordTable,
    importRecordExcel,
    exportRecordToExcel,
    syncToClipTable
};