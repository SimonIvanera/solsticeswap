import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedSolsticeSwap = await deploy("SolsticeSwap", {
    from: deployer,
    log: true,
  });

  console.log(`SolsticeSwap contract deployed at: ${deployedSolsticeSwap.address}`);
  console.log(`Network: ${hre.network.name}`);
};
export default func;
func.id = "deploy_solsticeSwap"; // id required to prevent reexecution
func.tags = ["SolsticeSwap"];
