import Runebase from "./rpc/runebase";
import Pirate from "./rpc/pirate";
import Komodo from "./rpc/komodo";

import rpcConfig from '../config/rpc_config';

let runebaseInstance;
let pirateInstance;

export function createRunebaseInstance() {
  return new Runebase(`http://${rpcConfig.runebase.rpc_user}:${rpcConfig.runebase.rpc_password}@localhost:${rpcConfig.runebase.rpc_port}`);

}

export function createPirateInstance() {
  return new Pirate(`http://${rpcConfig.pirate.rpc_user}:${rpcConfig.pirate.rpc_password}@localhost:${rpcConfig.pirate.rpc_port}`);

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
