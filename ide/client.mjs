import { homedir } from 'node:os';
import { join } from 'node:path';
import {AntigravityClient} from '../sidecars/panel/client.mjs';
import {readHubFiles} from '../sidecars/panel/discovery.mjs';
import {discoverIdeProcesses,discoverIdeLog} from './discovery.mjs';
export class IdeClient extends AntigravityClient {
  constructor({profile,debugPort,processes=discoverIdeProcesses,logPort=discoverIdeLog,readHubs=readHubFiles,home=homedir}={}){
    super();this.profile=profile;this.debugPort=debugPort;this.ideProcesses=processes;this.logPort=logPort;this.readHubs=readHubs;this.home=home;
  }
  async discoverNow(){
    this.server=null;
    const row=await this.ideProcesses(this.debugPort());
    const port=await this.logPort(this.profile,row.Ports);
    let csrf=row.CommandLine.match(/--csrf_token(?:=|\s+)"?([^\s"]+)/)?.[1];
    if(!csrf&&this.readHubs){
      const appData=row.CommandLine.match(/--app_data_dir(?:=|\s+)"?([^\s"]+)/)?.[1]||'antigravity-ide';
      const daemonDir=join(typeof this.home==='function'?this.home():this.home,'.gemini',appData,'daemon');
      const hubs=await this.readHubs(daemonDir).catch(()=>[]);
      const hub=hubs.find(h=>h&&h.pid===row.ProcessId&&(h.port===port||!h.port))||hubs.find(h=>h&&h.port===port);
      csrf=hub?.csrf;
    }
    if(!csrf)throw Error('IDE local API credential unavailable');
    this.server={port,csrf,pid:row.ProcessId};this.discoveredAt=Date.now();return this.server;
  }
}
