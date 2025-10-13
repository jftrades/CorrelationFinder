from scipy.stats import pearsonr, spearmanr, kendalltau, linregress
from correlation_backend.logic.json_utils import convert_analysis_result

def pearson_analysis(target_series, comparison_series):
    data = target_series.to_frame().join(comparison_series, how='inner').dropna()
    if len(data) < 2:
        return None, None
    result = pearsonr(data.iloc[:, 0], data.iloc[:, 1])
    return convert_analysis_result(result)

def spearman_analysis(target_series, comparison_series):
    data = target_series.to_frame().join(comparison_series, how='inner').dropna()
    if len(data) < 2:
        return None, None
    result = spearmanr(data.iloc[:, 0], data.iloc[:, 1])
    return convert_analysis_result(result)

def kendalltau_analysis(target_series, comparison_series):
    data = target_series.to_frame().join(comparison_series, how='inner').dropna()
    if len(data) < 2:
        return None, None
    result = kendalltau(data.iloc[:, 0], data.iloc[:, 1])
    return convert_analysis_result(result)

def linregress_analysis(target_series, comparison_series):
    data = target_series.to_frame().join(comparison_series, how='inner').dropna()
    if len(data) < 2:
        return None, None, None, None, None
    regress = linregress(data.iloc[:, 0], data.iloc[:, 1])
    return convert_analysis_result((regress.slope, regress.intercept, regress.rvalue, regress.pvalue, regress.stderr))
