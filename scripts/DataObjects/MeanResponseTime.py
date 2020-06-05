
class MeanResponseTime:
    def __init__(self, mean, ci_min, ci_max, ci_interval_half_width):
        self.mean = mean
        self.ci_min = ci_min
        self.ci_max = ci_max
        self.ci_interval_half_width = ci_interval_half_width

    def __str__(self):
        return f'Mean of response time: {self.mean:.2f}. \n' + \
            f'CI for mean: [{self.ci_min:.2f}, {self.ci_max:.2f}].\n'

