import os
import pandas as pd
import matplotlib.pyplot as plt
import calc_analysis
from read_data import read_parquet_files, get_specific_column
from calc_analysis import pearson_analysis, spearman_analysis


SPECIFIC_COLUMN_INDEX_1 = 4
SPECIFIC_COLUMN_INDEX_2 = 5

dfs = read_parquet_files()
for filename, df in dfs.items():
    specific_column_1 = get_specific_column(df, SPECIFIC_COLUMN_INDEX_1)
    specific_column_2 = get_specific_column(df, SPECIFIC_COLUMN_INDEX_2)
    print(specific_column_1)
    print(specific_column_2)
    
    corr_coef_pearson, p_value_pearson = pearson_analysis(specific_column_1, specific_column_2)
    print(corr_coef_pearson, p_value_pearson)

    corr_coef_spearman, p_value_spearman = spearman_analysis(specific_column_1, specific_column_2)
    print(corr_coef_spearman, p_value_spearman)