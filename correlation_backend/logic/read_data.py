import os
import pandas as pd
import matplotlib.pyplot as plt


def get_target_data_by_instrument(instrument: str, data_type: str, data_column: str):
    data_folder = "data"
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


def get_comparison_data_by_instrument(comparison_instruments: list[str], comparison_datatypes: list[str], comparison_data_columns: list[str]):
    data_folder = "data"
    results = []
    
    for instrument, data_type, data_column in zip(comparison_instruments, comparison_datatypes, comparison_data_columns):
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
                            results.append(df[data_column])
                            break
                else:
                    continue
                break
        else:
            results.append(None)
    
    return results