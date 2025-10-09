import os
import pandas as pd
import matplotlib.pyplot as plt
import calc_analysis


def read_parquet_files(data_folder='../data/BTCUSDT-PERP.BINANCE_LUNAR'):
    data_frames = {}
    for filename in os.listdir(data_folder):
        if filename.endswith('.parquet'):
            file_path = os.path.join(data_folder, filename)
            df = pd.read_parquet(file_path)
            data_frames[filename] = df
    return data_frames

def get_specific_column(df: pd.DataFrame, col_index: int):
    return df.iloc[:, col_index]

