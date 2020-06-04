# Plot the averaged mean response time (MRT), comparing three NGINX policies in the same graph

import matplotlib.pyplot as plt

from scripts.get_simulation_id import get_simulation_id
from scripts.steady_state_response_time import compute_mrt_for_simulation_ss
from scripts.finite_horizon_response_time import compute_mrt_for_simulation_fh

MIN_Y = 500

REPLICATION_NUM = 5
STEADY_STATE_ANALYSIS = False

if __name__ == "__main__":
    sim = get_simulation_id()

    policies = ['round-robin', 'least-connected', 'random']
    averages_response_time = []
    ci_intervals = []

    if STEADY_STATE_ANALYSIS:
        for i in range(0, 3):
            sim_id = sim - i
            print(f'Analyzing simulation {sim_id}')

            response_time = compute_mrt_for_simulation_ss(sim_id, autocorrelation_plot=False)
            averages_response_time.append(response_time.mean)
            ci_intervals.append(response_time.ci_interval_half_width)
    else:
        for i in range(len(policies), 0, -1):
            sim_id = sim - (i - 1) * REPLICATION_NUM
            print(f'Analyzing simulations [{sim_id - REPLICATION_NUM - 1}, {sim_id}]')

            response_time = compute_mrt_for_simulation_fh(sim_id)
            averages_response_time.append(response_time.mean)
            ci_intervals.append(response_time.ci_interval_half_width)

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

    # plt.ylim(bottom=MIN_Y, top=max(averages_response_time) * 1.005)
    plt.show()
