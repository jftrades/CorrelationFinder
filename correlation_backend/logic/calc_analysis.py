import pandas as pd
from pandas import Series
from scipy.stats import pearsonr, spearmanr, kendalltau, linregress, theilslopes

def pearson_analysis(first_column: Series, second_column: Series):
    data = pd.concat([first_column, second_column], axis=1, join='inner').dropna()
    
    if len(data) < 2:
        return None, None
    
    corr_coef_pearson, p_value_pearson = pearsonr(data.iloc[:, 0], data.iloc[:, 1])
    return corr_coef_pearson, p_value_pearson

def spearman_analysis(first_column: Series, second_column: Series):
    data = pd.concat([first_column, second_column], axis=1, join='inner').dropna()

    if len(data) < 2:
        return None, None
    
    corr_coef_spearman, p_value_spearman = spearmanr(data.iloc[:, 0], data.iloc[:, 1])
    return corr_coef_spearman, p_value_spearman

def kendalltau_analysis(first_column: Series, second_column: Series):
    data = pd.concat([first_column, second_column], axis=1, join='inner').dropna()

    if len(data) < 2:
        return None, None
    
    corr_coef_kendall, p_value_kendall = kendalltau(data.iloc[:, 0], data.iloc[:, 1])
    return corr_coef_kendall, p_value_kendall

def linregress_analysis(first_column: Series, second_column: Series):
    data = pd.concat([first_column, second_column], axis=1, join='inner').dropna()

    if len(data) < 2:
        return None, None, None, None, None
    
    regress = linregress(data.iloc[:, 0], data.iloc[:, 1])
    return regress.slope, regress.intercept, regress.rvalue, regress.pvalue, regress.stderr

def theilslopes_analysis(first_column: Series, second_column: Series):
    data = pd.concat([first_column, second_column], axis=1, join='inner').dropna()
    
    if len(data) < 2:
        return None, None, None, None
    
    theilregress = theilslopes(data.iloc[:, 0], data.iloc[:, 1])
    return theilregress.slope, theilregress.intercept, theilregress.low_slope, theilregress.high_slope

    