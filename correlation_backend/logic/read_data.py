import os
import pandas as pd
import matplotlib.pyplot as plt


def read_parquet_files(data_folder='../data/BTCUSDT-PERP.BINANCE_LUNAR'):
    data_frames = {}
    for filename in os.listdir(data_folder):
        if filename.endswith('.parquet'):
            file_path = os.path.join(data_folder, filename)
            df = pd.read_parquet(file_path)
            data_frames[filename] = df
    return data_frames

def plot_data(df):
    columns_to_show = [
        "instrument_id", "ts_event", "ts_init", "contributors_active", "contributors_created",
        "interactions", "posts_active", "posts_created", "sentiment", "spam", "alt_rank",
        "circulating_supply", "close", "galaxy_score", "high", "low", "market_cap",
        "market_dominance", "open", "social_dominance", "volume_24h"
    ]
    print(df[columns_to_show].head())

dfs = read_parquet_files()
for filename, df in dfs.items():
    plot_data(df)