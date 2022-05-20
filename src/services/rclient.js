import Runebase from "./rpc/runebase";
import Pirate from "./rpc/pirate";
import Tokel from "./rpc/tokel";

import rpcConfig from '../config/rpc_config';

let runebaseInstance;
let pirateInstance;
let tokelInstance;

export function createRunebaseInstance() {
  return new Runebase(`http://${rpcConfig.runebase.rpc_user}:${rpcConfig.runebase.rpc_password}@localhost:${rpcConfig.runebase.rpc_port}`);
}

export function createPirateInstance() {
  return new Pirate(`http://${rpcConfig.pirate.rpc_user}:${rpcConfig.pirate.rpc_password}@localhost:${rpcConfig.pirate.rpc_port}`);
}

export function createTokelInstance() {
  return new Tokel(`http://${rpcConfig.tokel.rpc_user}:${rpcConfig.tokel.rpc_password}@localhost:${rpcConfig.tokel.rpc_port}`);
}

export function getRunebaseInstance() {
  if (!runebaseInstance) {
    runebaseInstance = createRunebaseInstance();
  }
  return runebaseInstance;
}

export function getPirateInstance() {
  if (!pirateInstance) {
    pirateInstance = createPirateInstance();
  }
  return pirateInstance;
}

export function getTokelInstance() {
  if (!tokelInstance) {
    tokelInstance = createTokelInstance();
  }
  return tokelInstance;
}
