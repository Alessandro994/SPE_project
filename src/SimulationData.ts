import { ChildProcess } from 'child_process';
import { Random, MersenneTwister19937 } from 'random-js';

/**
 * Container for all the global information useful during a simulation
 */
export class SimulationData {

    /**
     * Current number of upstream servers
     */
    numServers: number;
    /**
     * Nginx load balancing algorithm
     */
    loadBalancing?: "random" | "least_conn";
    /**
     * Starting port for the upstream servers
     */
    readonly startingPort: number = 5000;

    /**
     * Reference to the spawned processes
     */
    processes: Array<ChildProcess> = [];

    /**
     * Random number generator to obtain the seed for the express servers
     */
    random: Random;

    /**
     * Whether to enable or not the autoscaling of upstream servers
     */
    readonly autoScale = process.env.AUTOSCALE ? true : false

    /**
     * Timeout used to cancel the autoscaling function when shutting down
     */
    autoScaleTimeout?: NodeJS.Timeout

    /**
     *
     * @param id Simulation id
     */
    constructor(readonly id: number) {
        const NUM_SERVERS = process.env.NUM_SERVERS as string;
        if (!NUM_SERVERS) {
            throw new Error("Please define env variable NUM_SERVERS");
        }
        this.numServers = Number.parseInt(NUM_SERVERS);

        const seed = process.env.SEED;
        if (seed === undefined) {
            console.log("Using random seed");
            this.random = new Random(MersenneTwister19937.autoSeed())
        } else {
            console.log(`Using seed ${seed}`);
            this.random = new Random(MersenneTwister19937.seed(parseInt(seed)))
        }

        let loadBalancing = process.env.LOAD_BALANCING;
        if (!loadBalancing) {
            console.info("Defaulting to round-robin load balancing policy");
        }
        else {
            //@ts-ignore
            this.loadBalancing = loadBalancing;
            console.info(`Using ${loadBalancing} load balancing policy`);
        }
    }

    addProcess(process: ChildProcess) {
        process.on('close', (code, _signal) => {
            if (code) {
                console.log(`Process exited with code ${code}. Shutting down simulation`);
                this.stopSimulation(true)
            }
        })
        this.processes.push(process);
    }

    stopSimulation(failure = false) {
        this.processes.forEach(process => process.kill());

        if (this.autoScaleTimeout) {
            // Stop autoscaling
            clearTimeout(this.autoScaleTimeout);
        }

        if (failure) {
            process.exit(1);
        }
    }
}
