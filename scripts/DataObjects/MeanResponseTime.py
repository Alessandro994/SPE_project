
class MeanResponseTime:
    def __init__(self, mean, ci_min, ci_max):
        self.mean = mean
        self.ci_min = ci_min
        self.ci_max = ci_max

    def __str__(self):
        return f'Mean of response time: {self.mean:.2f}. \n' + \
            f'CI for mean: [{self.ci_min:.2f}, {self.ci_max:.2f}].'

