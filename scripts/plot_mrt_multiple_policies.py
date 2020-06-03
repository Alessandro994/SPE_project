# Plot the Averaged mean response time, confronting three Nginx policies in the same graph
import matplotlib.pyplot as plt
import numpy as np

from steady_state_response_time import (compute_mrt_for_simulation,
                                        get_simulation_id)

MIN_Y = 500

if __name__ == "__main__":
    sim = get_simulation_id()

    policies = ['round-robin', 'random', 'least-connected']
    averages_response_time = []
    ci_intervals = []

    for i in range(0, 3):
        sim_id = sim - i
        print(f'Analyzing simulation {sim_id}')

        response_time = compute_mrt_for_simulation(
            sim_id, autocorrelation_plot=False)
        averages_response_time.append(response_time.mean)
        ci_intervals.append(response_time.ci_interval)

    plt.errorbar(
        x=policies,
        y=averages_response_time,
        yerr=ci_intervals,
        # Disable line between x data points
        ls='None',
        fmt='_',
        lolims=True,
        uplims=True,
    )
    plt.title('Average response time per policy')
    plt.xlabel('Load balancing policy')
    plt.ylabel('Average response time (ms)')
    plt.grid(True)

    plt.ylim(bottom=MIN_Y, top=(max(averages_response_time) + max(ci_intervals)) * 1.005)
    plt.show()
