// 视频剪辑模块

// 全局变量
let activeCell = null;
let videoElement = null;
let uploadedVideoPath = null;
let uploadedExcelData = null;

/**
 * 开始剪辑视频
 */
function startCutting() {
    // 检查是否选择了视频文件
    if (!uploadedVideoPath) {
        alert('请先选择视频文件');
        return;
    }
    
    // 获取表格数据
    const tableData = [];
    const rows = document.querySelectorAll('#clipTable tbody tr');
    
    // 检查是否有剪辑数据
    if (rows.length === 0) {
        alert('请添加剪辑时间段');
        return;
    }
    
    // 收集表格数据
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {  // 确保有足够的单元格
            const startTime = cells[1].textContent.trim();
            const endTime = cells[2].textContent.trim();
            const title = cells[3].textContent.trim() || '未命名';
            
            // 检查时间是否有效
            if (startTime && endTime && startTime !== '00:00:00' && endTime !== '00:00:00') {
                tableData.push({
                    '开始时间': startTime,
                    '结束时间': endTime,
                    '剪辑标题': title
                });
            }
        }
    });
    
    // 检查是否有有效的剪辑数据
    if (tableData.length === 0) {
        alert('请填写有效的剪辑时间段');
        return;
    }
    
    // 发送剪辑请求到服务器
    fetch('/cut_videos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            video_path: uploadedVideoPath,
            excel_data: tableData
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            document.getElementById('cutResult').textContent = '剪辑失败: ' + data.error;
        } else {
            document.getElementById('cutResult').textContent = data.result;
            // 更新输出文件列表
            // updateOutputFilesList(); // 这个函数在concat.js中定义，不应该在这里调用
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('cutResult').textContent = '剪辑失败: ' + error;
    });
}

/**
 * 初始化视频剪辑标签页
 */
function initCuttingTab() {
    // 页面加载时刷新视频列表
    refreshVideoListForCutting();
    // 选择视频文件后直接播放，不需要上传
    document.getElementById('videoFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // 直接播放视频，不上传到服务器
            playUploadedVideo(file);
            // 清除已选择的现有文件
            document.getElementById('existingVideoSelectForCutting').value = '';
        }
    });
    // 从已上传文件中选择视频（视频剪辑页面）
    document.getElementById('existingVideoSelectForCutting').addEventListener('change', function(e) {
        const selectedValue = e.target.value;
        if (selectedValue) {
            // 清除文件选择
            document.getElementById('videoFile').value = '';
            // 设置上传路径
            uploadedVideoPath = selectedValue;
            // 获取文件名
            const fileName = selectedValue.split('/').pop();
            document.getElementById('cutResult').textContent = '已选择文件: ' + fileName;
            // 播放视频
            playVideoFromPath(selectedValue);
        }
    });
    // 刷新视频列表按钮（视频剪辑页面）
    document.getElementById('refreshVideoListForCuttingBtn').addEventListener('click', function() {
        refreshVideoListForCutting();
    });
    // 上传视频按钮
    document.getElementById('uploadVideoBtn').addEventListener('click', function() {
        const fileInput = document.getElementById('videoFile');
        if (fileInput.files.length === 0) {
            alert('请先选择视频文件');
            return;
        }
        // 显示上传进度条
        const progressContainer = document.getElementById('videoUploadProgressContainer');
        const progressBar = document.getElementById('videoUploadProgress');
        const progressText = document.getElementById('videoUploadProgressText');
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
            formData.append('video', fileInput.files[0]);
            fetch('/upload_video', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                // 隐藏上传进度条
                progressContainer.style.display = 'none';
                clearInterval(interval); // 确保清除定时器
                if (data.error) {
                    alert('上传失败: ' + data.error);
                } else {
                    uploadedVideoPath = data.filepath;
                    document.getElementById('cutResult').textContent = '视频上传成功: ' + data.filename;
                    // 刷新视频列表
                    refreshVideoListForCutting();
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
    });
    // 上传Excel按钮
    document.getElementById('uploadExcelBtn').addEventListener('click', function() {
        const fileInput = document.getElementById('excelFile');
        if (fileInput.files.length === 0) {
            alert('请先选择Excel文件');
            return;
        }
        // 显示上传进度条
        const progressContainer = document.getElementById('excelUploadProgressContainer');
        const progressBar = document.getElementById('excelUploadProgress');
        const progressText = document.getElementById('excelUploadProgressText');
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
                    uploadedExcelData = tableData;
                    document.getElementById('cutResult').textContent = 'Excel上传成功: ' + result.filename;
                    // 更新表格内容
                    updateClipTable(tableData);
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
    });
    // 导出Excel按钮
    document.getElementById('exportExcelBtn').addEventListener('click', function() {
        exportToExcel();
    });
    // 添加行按钮
    document.getElementById('addRowBtn').addEventListener('click', function() {
        const tbody = document.querySelector('#clipTable tbody');
        const newRow = tbody.insertRow();
        // 添加复选框单元格
        const checkboxCell = newRow.insertCell(0);
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'row-checkbox';
        checkboxCell.appendChild(checkbox);
        const cell1 = newRow.insertCell(1);
        const cell2 = newRow.insertCell(2);
        const cell3 = newRow.insertCell(3);
        const durationCell = newRow.insertCell(4);
        const actionCell = newRow.insertCell(5);
        cell1.className = 'editable';
        cell1.contentEditable = true;
        cell1.textContent = '00:00:00';
        cell2.className = 'editable';
        cell2.contentEditable = true;
        cell2.textContent = '00:00:00';
        cell3.className = 'editable';
        cell3.contentEditable = true;
        cell3.textContent = '';
        durationCell.className = 'duration-cell';
        durationCell.textContent = '0';
        // 添加删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-row-btn';
        deleteBtn.textContent = '删除';
        deleteBtn.addEventListener('click', function() {
            if (confirm('确定要删除这一行吗？')) {
                tbody.removeChild(newRow);
                updateSelectAllCheckbox();
            }
        });
        actionCell.appendChild(deleteBtn);
        // 添加时间变化监听器以自动计算时长
        cell1.addEventListener('input', function() {
            const duration = calculateDuration(cell1.textContent, cell2.textContent);
            durationCell.textContent = duration;
        });
        cell2.addEventListener('input', function() {
            const duration = calculateDuration(cell1.textContent, cell2.textContent);
            durationCell.textContent = duration;
        });
        // 添加点击事件以激活单元格
        cell1.addEventListener('click', function() {
            setActiveCell(this);
        });
        cell2.addEventListener('click', function() {
            setActiveCell(this);
        });
        cell3.addEventListener('click', function() {
            setActiveCell(this);
        });
        // 添加复选框事件监听器
        checkbox.addEventListener('change', function() {
            updateSelectAllCheckbox();
        });
    });
    // 删除选中行按钮
    document.getElementById('deleteSelectedRowsBtn').addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('#clipTable tbody .row-checkbox:checked');
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
            updateSelectAllCheckbox();
        }
    });
    // 全选复选框
    document.getElementById('selectAllCheckbox').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('#clipTable tbody .row-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });
    // 记录时间点表格全选复选框
    document.getElementById('selectRecordAllCheckbox').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.record-row-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });
    // 为现有表格单元格添加点击事件
    document.querySelectorAll('#clipTable .editable').forEach(cell => {
        cell.addEventListener('click', function() {
            setActiveCell(this);
        });
    });
    // 为现有的删除按钮添加事件监听器
    document.querySelectorAll('#clipTable .delete-row-btn').forEach(button => {
        button.addEventListener('click', function() {
            if (confirm('确定要删除这一行吗？')) {
                const row = this.closest('tr');
                row.remove();
                updateSelectAllCheckbox();
            }
        });
    });
    
    // 跳转到激活时间点播放按钮
    document.getElementById('playActiveTimeBtn').addEventListener('click', function() {
        playActiveTime();
    });
    
    // 计算时长按钮
    document.getElementById('calculateDurationBtn').addEventListener('click', function() {
        calculateAllDurations();
    });
    
    // 初始化视频播放器功能
    initCuttingPlayer();
    
    // 开始剪辑按钮
    document.getElementById('cutButton').addEventListener('click', function() {
        startCutting();
    });
}

/**
 * 刷新视频列表（视频剪辑页面）
 */
function refreshVideoListForCutting() {
    fetch('/list_upload_videos')
    .then(response => response.json())
    .then(data => {
        const selectElement = document.getElementById('existingVideoSelectForCutting');
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
 * 从路径播放视频
 */
function playVideoFromPath(videoPath, targetPlayerId) {
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
        videoPlayer = document.getElementById('cuttingVideoPlayer');
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
 * 播放上传的视频文件
 */
function playUploadedVideo(file) {
    const videoPlayer = document.getElementById('cuttingVideoPlayer');
    const url = URL.createObjectURL(file);
    videoPlayer.src = url;
    videoPlayer.play();
}

/**
 * 初始化视频剪辑页面的视频播放器
 */
function initCuttingPlayer() {
    const videoPlayer = document.getElementById('cuttingVideoPlayer');
    const currentTimeDisplay = document.getElementById('cuttingCurrentTime');
    const durationDisplay = document.getElementById('cuttingDuration');
    // 获取进度条元素
    const progressContainer = document.getElementById('cuttingProgressContainer');
    const progressBarFill = document.getElementById('cuttingProgressBarFill');
    // 视频时间更新
    videoPlayer.addEventListener('timeupdate', function() {
        const currentTime = videoPlayer.currentTime;
        currentTimeDisplay.textContent = secondsToHMS(currentTime);

        // 更新进度条
        if (videoPlayer.duration) {
            const progressPercent = (currentTime / videoPlayer.duration) * 100;
            progressBarFill.style.width = progressPercent + '%';
        }
    });

    // 视频加载元数据后显示总时长
    videoPlayer.addEventListener('loadedmetadata', function() {
        const duration = videoPlayer.duration;
        durationDisplay.textContent = secondsToHMS(duration);
    });

    // 进度条点击跳转
    progressContainer.addEventListener('click', function(e) {
        if (videoPlayer.duration) {
            const rect = this.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            videoPlayer.currentTime = pos * videoPlayer.duration;
        }
    });

    // 添加鼠标悬停显示时间的功能
    progressContainer.addEventListener('mousemove', function(e) {
        if (videoPlayer.duration) {
            const rect = this.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            const hoverTime = pos * videoPlayer.duration;

            // 显示时间提示
            const hoverTimeDisplay = document.getElementById('cuttingHoverTimeDisplay');
            hoverTimeDisplay.textContent = secondsToHMS(hoverTime);

            // 设置位置
            const hoverPos = e.clientX - rect.left;
            hoverTimeDisplay.style.left = (hoverPos - 30) + 'px';
            hoverTimeDisplay.style.display = 'block';
        }
    });

    // 鼠标离开进度条时隐藏时间显示
    progressContainer.addEventListener('mouseleave', function() {
        const hoverTimeDisplay = document.getElementById('cuttingHoverTimeDisplay');
        hoverTimeDisplay.style.display = 'none';
    });

    // 播放/暂停按钮
    document.getElementById('cuttingPlayPauseBtn').addEventListener('click', function() {
        if (videoPlayer.paused) {
            videoPlayer.play();
        } else {
            videoPlayer.pause();
        }
    });
}

/**
 * 计算所有行的时长
 */
function calculateAllDurations() {
    const rows = document.querySelectorAll('#clipTable tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {  // 6列：checkbox, 开始时间, 结束时间, 剪辑标题, 时长, 操作
            const startTimeCell = cells[1];
            const endTimeCell = cells[2];
            const durationCell = cells[4];

            const startTime = startTimeCell.textContent;
            const endTime = endTimeCell.textContent;

            // 计算时长
            const duration = calculateDuration(startTime, endTime);
            durationCell.textContent = duration;
        }
    });
    alert('所有行的时长已重新计算');
}

/**
 * 跳转到激活时间点播放（视频剪辑页面）
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
    const videoPlayer = document.getElementById('cuttingVideoPlayer') || 
                      document.getElementById('videoPlayer') ||
                      document.getElementById('compressVideoPlayer');
    if (videoPlayer) {
        videoPlayer.currentTime = seconds;
        videoPlayer.play();
    }
}

/**
 * 更新全选复选框状态
 */
function updateSelectAllCheckbox() {
    const allCheckboxes = document.querySelectorAll('#clipTable tbody .row-checkbox');
    const checkedCheckboxes = document.querySelectorAll('#clipTable tbody .row-checkbox:checked');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
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
 * 更新表格（通用函数，可处理不同表格）
 */
function updateTable(data, tableSelector, checkboxClass, deleteBtnClass) {
    const tbody = document.querySelector(tableSelector + ' tbody');
    tbody.innerHTML = ''; // 清空现有内容
    data.forEach(row => {
        const newRow = tbody.insertRow();
        // 添加复选框单元格
        const checkboxCell = newRow.insertCell(0);
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = checkboxClass;
        checkboxCell.appendChild(checkbox);

        // 添加数据单元格
        for (let i = 0; i < row.length; i++) {
            const cell = newRow.insertCell(i + 1);
            cell.textContent = row[i];
            cell.className = 'editable';
        }

        // 添加时长单元格
        const durationCell = newRow.insertCell(row.length + 1);
        durationCell.className = 'duration-cell';
        if (row.length >= 2) {
            const duration = calculateDuration(row[0], row[1]);
            durationCell.textContent = duration;
        }

        // 添加操作单元格
        const actionCell = newRow.insertCell(row.length + 2);
        const deleteBtn = document.createElement('button');
        deleteBtn.className = deleteBtnClass;
        deleteBtn.textContent = '删除';
        deleteBtn.addEventListener('click', function() {
            if (confirm('确定要删除这一行吗？')) {
                tbody.removeChild(newRow);
                // 根据表格类型更新全选复选框状态
                if (tableSelector === '#clipTable') {
                    updateSelectAllCheckbox();
                } else {
                    updateRecordSelectAllCheckbox();
                }
            }
        });
        actionCell.appendChild(deleteBtn);

        // 添加事件监听器
        const cells = newRow.querySelectorAll('.editable');
        cells.forEach((cell, index) => {
            // 添加点击事件以激活单元格
            cell.addEventListener('click', function() {
                setActiveCell(this);
            });

            // 对于前两个单元格（时间），添加输入事件以自动计算时长
            if (index < 2) {
                cell.addEventListener('input', function() {
                    const rowCells = newRow.querySelectorAll('.editable');
                    if (rowCells.length >= 2) {
                        const duration = calculateDuration(rowCells[0].textContent, rowCells[1].textContent);
                        durationCell.textContent = duration;
                    }
                });
            }
        });

        // 添加复选框事件监听器
        checkbox.addEventListener('change', function() {
            // 根据表格类型更新全选复选框状态
            if (tableSelector === '#clipTable') {
                updateSelectAllCheckbox();
            } else {
                updateRecordSelectAllCheckbox();
            }
        });
    });

    // 根据表格类型更新全选复选框状态
    if (tableSelector === '#clipTable') {
        updateSelectAllCheckbox();
    } else {
        updateRecordSelectAllCheckbox();
    }
}

/**
 * 更新剪辑表格（保持原函数名以确保向后兼容）
 */
function updateClipTable(data) {
    updateTable(data, '#clipTable', 'row-checkbox', 'delete-row-btn');
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
 * 导出表格数据为Excel文件
 */
function exportToExcel() {
    // 获取表格数据
    const tableData = [];
    const rows = document.querySelectorAll('#clipTable tbody tr');
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
        body: JSON.stringify({ data: tableData })
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
 * 更新记录时间点表格全选复选框状态
 */
function updateRecordSelectAllCheckbox() {
    const allCheckboxes = document.querySelectorAll('.record-row-checkbox');
    const checkedCheckboxes = document.querySelectorAll('.record-row-checkbox:checked');
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

// 导出函数供其他模块使用
export {
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
    startCutting
};