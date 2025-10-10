import os
from os import path, listdir
import pandas as pd
import matplotlib.pyplot as plt

data_folder = "data"

def get_available_data_columns(instrument: str, data_type: str):
    instrument = instrument.lower()
    data_type = data_type.lower()

    instrument_folder = None
    
    for foldername in listdir(data_folder):
        if instrument in foldername.lower():
            instrument_folder = path.join(data_folder, foldername)
            break
    
    if instrument_folder is None:
        return None

    for data_type_folder in listdir(instrument_folder):
        if data_type not in data_type_folder.lower():
            continue
        
        data_type_folder_path = path.join(instrument_folder, data_type_folder)

        file_path = listdir(data_type_folder_path)[0]
        file_path = path.join(data_type_folder_path, file_path)

        df = pd.read_parquet(file_path)
        return list(df.columns)

    return None

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
                    if data_column in df.columns:
                        return df[data_column]

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
            print(instrument)

            for foldername in os.listdir(data_folder):
                if instrument not in foldername.lower():
                    continue

                folder_path = os.path.join(data_folder, foldername)
                for subfolder in os.listdir(folder_path):
                    if data_type not in subfolder.lower():
                        continue

                    exact_folder_path = os.path.join(folder_path, subfolder)
                    print(exact_folder_path)
                    filename = os.listdir(exact_folder_path)[0]

                    df = pd.read_parquet(os.path.join(exact_folder_path, filename))
                    for data_column in df.columns:
                        if data_column in comparison_data_columns:
                            results.append(df[data_column])

    return results
