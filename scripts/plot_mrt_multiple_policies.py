# Plot the Averaged mean response time, confronting three Nginx policies in the same graph
from steady_state_response_time import get_simulation_id, compute_mrt_for_simulation

if __name__ == "__main__":
    sim = get_simulation_id()
    print(f'Analyzing simulation {sim}')

    # for range(3) :
    #     response_time = compute_mrt_for_simulation(sim)
