# Plot the Averaged mean response time, confronting three Nginx policies in the same graph
from steady_state_response_time import get_simulation_id, compute_mrt_for_simulation
import matplotlib.pyplot as plt
import numpy as np

if __name__ == "__main__":
    sim = get_simulation_id()
    print(f'Analyzing simulation {sim}')

    policies = ['least-connected', 'random', 'round-robin']
    averages_response_time = []
    ci_intervals = []

    for i in range(0, 3):
        response_time = compute_mrt_for_simulation(sim-i, autocorrelation_plot=False)
        averages_response_time.append(response_time.mean)
        ci_intervals.append(response_time.ci_interval)

    plt.errorbar(
        x=policies,
        y=averages_response_time,
        yerr=ci_intervals,
        # Disable line between x data points
        ls='None',
        lolims=True,
        uplims=True,
    )
    plt.title('Average response time per policy')
    plt.xlabel('Load balancing policy')
    plt.ylabel('Average response time (ms)')
    plt.grid(True)
    plt.show()
