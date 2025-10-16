import os
from os import path, listdir
import pandas as pd
import struct
import numpy as np

data_folder = "data"

def get_available_instruments():
    instruments = []
    if not os.path.exists(data_folder):
        return instruments
    
    for foldername in listdir(data_folder):
        folder_path = path.join(data_folder, foldername)
        if os.path.isdir(folder_path):
            instruments.append(foldername)
    
    return sorted(instruments)

def get_available_datatypes(instrument: str):
    datatypes = []
    if not instrument:
        return datatypes
    
    instrument_folder = None
    
    for foldername in listdir(data_folder):
        if instrument == foldername or instrument.lower() == foldername.lower():
            instrument_folder = path.join(data_folder, foldername)
            break
    
    if instrument_folder is None or not os.path.exists(instrument_folder):
        return datatypes
    
    for subfolder in listdir(instrument_folder):
        subfolder_path = path.join(instrument_folder, subfolder)
        if os.path.isdir(subfolder_path):
            datatypes.append(subfolder)
    
    return sorted(datatypes)

def decode_binary_column(series):
    def decode_value(val):
        if pd.isna(val):
            return None
        if isinstance(val, (int, float)):
            return float(val)
        if isinstance(val, bytes) and len(val) == 8:
            return float(struct.unpack('<q', val)[0])
        if isinstance(val, str):
            return float(val)
        return None
    
    return series.apply(decode_value)

def get_available_data_columns(instruments: list[str], data_types: list[str]):
    data_column_list = []
    for instrument in instruments:
        for data_type in data_types:
            instrument = instrument.lower()
            data_type = data_type.lower()

            instrument_folder = None
            
            for foldername in listdir(data_folder):
                if instrument in foldername.lower():
                    instrument_folder = path.join(data_folder, foldername)
                    break
            
            if instrument_folder is None:
                continue

            for data_type_folder in listdir(instrument_folder):
                if data_type not in data_type_folder.lower():
                    continue
                
                data_type_folder_path = path.join(instrument_folder, data_type_folder)
                file_path = listdir(data_type_folder_path)[0]
                file_path = path.join(data_type_folder_path, file_path)
                df = pd.read_parquet(file_path)
                
                if not data_column_list:
                    data_column_list = list(df.columns)
                else:
                    data_column_list = list(set(data_column_list) & set(df.columns))

    return data_column_list

def get_target_data_by_instrument(instrument: str, data_type: str, data_column: str):

    instrument = instrument.lower()
    data_type = data_type.lower()

    for foldername in os.listdir(data_folder):
        if instrument in foldername.lower():
            folder_path = os.path.join(data_folder, foldername)
            for subfolder in os.listdir(folder_path):
                if data_type in subfolder.lower():
                    exact_folder_path = os.path.join(folder_path, subfolder)

                    filename = os.listdir(exact_folder_path)[0]
                    df = pd.read_parquet(os.path.join(exact_folder_path, filename))
                    
                    if 'ts_event' in df.columns:
                        df = df.set_index('ts_event')
                    elif 'ts_init' in df.columns:
                        df = df.set_index('ts_init')
                    elif 'timestamp' in df.columns:
                        df = df.set_index('timestamp')
                    
                    if data_column in df.columns:
                        series = df[data_column]
                        
                        if series.dtype == 'object':
                            first_non_null = series.dropna().iloc[0] if len(series.dropna()) > 0 else None
                            if isinstance(first_non_null, bytes):
                                series = decode_binary_column(series)
                            else:
                                series = pd.to_numeric(series, errors='coerce')
                        
                        series = series.dropna()
                        series.name = 'target'
                        return series

    return None


def get_comparison_data_by_instrument(
    comparison_instruments: list[str],
    comparison_datatypes: list[str],
    comparison_data_columns: list[str],
):
    data_folder = "data"
    results = []

    for instrument in comparison_instruments:
        for data_type in comparison_datatypes:
            instrument = instrument.lower()
            data_type = data_type.lower()

            for foldername in os.listdir(data_folder):
                if instrument not in foldername.lower():
                    continue

                folder_path = os.path.join(data_folder, foldername)
                for subfolder in os.listdir(folder_path):
                    if data_type not in subfolder.lower():
                        continue

                    exact_folder_path = os.path.join(folder_path, subfolder)
                    filename = os.listdir(exact_folder_path)[0]
                    df = pd.read_parquet(os.path.join(exact_folder_path, filename))
                    
                    if 'ts_event' in df.columns:
                        df = df.set_index('ts_event')
                    elif 'ts_init' in df.columns:
                        df = df.set_index('ts_init')
                    elif 'timestamp' in df.columns:
                        df = df.set_index('timestamp')
                    
                    for data_column in df.columns:
                        if data_column in comparison_data_columns:
                            series = df[data_column]
                            
                            if series.dtype == 'object':
                                first_non_null = series.dropna().iloc[0] if len(series.dropna()) > 0 else None
                                if isinstance(first_non_null, bytes):
                                    series = decode_binary_column(series)
                                else:
                                    series = pd.to_numeric(series, errors='coerce')
                            
                            series = series.dropna()
                            series.name = 'comparison'
                            results.append(series)

    return results


def get_timestamp_range_for_datatype(instrument: str, data_type: str):
    instrument = instrument.lower()
    data_type = data_type.lower()

    for foldername in os.listdir(data_folder):
        if instrument not in foldername.lower():
            continue

        folder_path = os.path.join(data_folder, foldername)
        for subfolder in os.listdir(folder_path):
            if data_type not in subfolder.lower():
                continue

            exact_folder_path = os.path.join(folder_path, subfolder)
            filename = os.listdir(exact_folder_path)[0]
            df = pd.read_parquet(os.path.join(exact_folder_path, filename))
            
            timestamp_col = None
            if 'ts_event' in df.columns:
                timestamp_col = 'ts_event'
            elif 'ts_init' in df.columns:
                timestamp_col = 'ts_init'
            elif 'timestamp' in df.columns:
                timestamp_col = 'timestamp'
            
            if timestamp_col:
                return {
                    'min_timestamp': int(df[timestamp_col].min()),
                    'max_timestamp': int(df[timestamp_col].max())
                }
    
    return None


def detect_timeframe(series):
    if series is None or len(series) < 2:
        return None
    
    timestamps = sorted(series.index.tolist())
    diffs = []
    for i in range(min(100, len(timestamps) - 1)):
        diffs.append(timestamps[i + 1] - timestamps[i])
    
    if not diffs:
        return None
    
    median_diff = pd.Series(diffs).median()
    return int(median_diff)


def align_series_with_offset(target_series, comparison_series, offset=0):
    if target_series is None or comparison_series is None:
        return None, None
    
    if len(target_series) == 0 or len(comparison_series) == 0:
        return target_series, comparison_series
    
    if offset == 0:
        common_index = target_series.index.intersection(comparison_series.index)
        if len(common_index) == 0:
            return target_series, comparison_series
        
        target_aligned = target_series.loc[common_index].dropna()
        comparison_aligned = comparison_series.loc[common_index].dropna()
        
        final_index = target_aligned.index.intersection(comparison_aligned.index)
        return target_aligned.loc[final_index], comparison_aligned.loc[final_index]
    
    target_timestamps = sorted(target_series.index.tolist())
    comparison_timestamps = sorted(comparison_series.index.tolist())
    
    target_dict = target_series.to_dict()
    comparison_dict = comparison_series.to_dict()
    
    aligned_target_data = []
    aligned_comparison_data = []
    aligned_indices = []
    
    import bisect
    
    for target_ts in target_timestamps:
        target_val = target_dict.get(target_ts)
        if target_val is None or pd.isna(target_val):
            continue
        
        if offset > 0:
            pos = bisect.bisect_right(comparison_timestamps, target_ts)
            if pos + offset - 1 < len(comparison_timestamps):
                comp_ts = comparison_timestamps[pos + offset - 1]
            else:
                continue
        else:
            pos = bisect.bisect_left(comparison_timestamps, target_ts)
            if pos + offset >= 0:
                comp_ts = comparison_timestamps[pos + offset]
            else:
                continue
        
        comp_val = comparison_dict.get(comp_ts)
        if comp_val is None or pd.isna(comp_val):
            continue
        
        aligned_target_data.append(target_val)
        aligned_comparison_data.append(comp_val)
        aligned_indices.append(target_ts)
    
    if not aligned_target_data:
        return pd.Series(dtype=float), pd.Series(dtype=float)
    
    target_aligned = pd.Series(data=aligned_target_data, index=aligned_indices, name='target')
    comparison_aligned = pd.Series(data=aligned_comparison_data, index=aligned_indices, name='comparison')
    
    return target_aligned, comparison_aligned
