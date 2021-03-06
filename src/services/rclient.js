import { config } from "dotenv";
import Runebase from "./rpc/runebase";
import Pirate from "./rpc/pirate";
import Tokel from "./rpc/tokel";

config();

let runebaseInstance;
let pirateInstance;
let tokelInstance;

export function createRunebaseInstance() {
  return new Runebase(`http://${process.env.RUNEBASE_RPC_USER}:${process.env.RUNEBASE_RPC_PASS}@localhost:${process.env.RUNEBASE_RPC_PORT}`);
}

export function createPirateInstance() {
  return new Pirate(`http://${process.env.PIRATE_RPC_USER}:${process.env.PIRATE_RPC_PASS}@localhost:${process.env.PIRATE_RPC_PORT}`);
}

export function createTokelInstance() {
  return new Tokel(`http://${process.env.TOKEL_RPC_USER}:${process.env.TOKEL_RPC_PASS}@localhost:${process.env.TOKEL_RPC_PORT}`);
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
