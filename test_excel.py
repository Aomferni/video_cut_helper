#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
测试Excel处理功能
"""

import pandas as pd
import json
from datetime import datetime, time

def test_excel_processing():
    """测试Excel数据处理"""
    # 创建测试数据
    test_data = {
        '开始时间': [time(0, 0, 0), time(0, 1, 30), time(0, 3, 15)],
        '结束时间': [time(0, 1, 30), time(0, 3, 0), time(0, 5, 0)],
        '剪辑标题': ['片段1', '片段2', '片段3']
    }
    
    df = pd.DataFrame(test_data)
    print("原始数据:")
    print(df)
    print("\n数据类型:")
    print(df.dtypes)
    
    # 模拟处理过程
    for col in df.columns:
        if df[col].dtype == 'datetime64[ns]':
            # 时间类型转换为字符串格式 HH:MM:SS
            df[col] = df[col].dt.strftime('%H:%M:%S')
        elif df[col].dtype == 'timedelta64[ns]':
            # 时间差类型转换为字符串
            df[col] = df[col].astype(str)
        else:
            # 其他类型转换为字符串
            df[col] = df[col].apply(lambda x: str(x) if pd.notna(x) else '')
    
    print("\n处理后的数据:")
    print(df)
    print("\n数据类型:")
    print(df.dtypes)
    
    # 测试JSON序列化
    try:
        data = df.to_dict('records')
        json_str = json.dumps(data, ensure_ascii=False)
        print("\nJSON序列化成功:")
        print(json_str)
        print("\n✅ Excel处理功能测试通过")
    except Exception as e:
        print(f"\n❌ JSON序列化失败: {e}")

if __name__ == "__main__":
    test_excel_processing()