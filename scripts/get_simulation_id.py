import os

SIMULATION_ID_FILE = "build/simulation.txt"


def get_simulation_id() -> int:
    """

    :rtype: the simulation id
    """
    if not os.environ.get("SIMULATION"):
        # Read the ID of the simulation from the file
        simulation_file = open(SIMULATION_ID_FILE, "r")
        simulation_id = simulation_file.read()
    else:
        simulation_id = os.environ.get("SIMULATION")

    return int(simulation_id)
