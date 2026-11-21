import { getUrlClass } from "@/server/utils/getUrlClass";
import { urlIsAbsolute } from "./vulcan-lib/utils";

interface DomainList {
  onsiteDomains: string[]
  mirrorDomains: string[]
}

const LwAfDomainWhitelist: DomainList = {
  onsiteDomains: [
    "lesswrong.com",
    "lesserwrong.com",
    "lessestwrong.com",
    "baserates.org",
    "alignmentforum.org",
    "alignment-forum.com",
    "arbital.com",
    // TODO: fix this to not use `getCommandLineArguments` anymore
    // `localhost:${getCommandLineArguments().localhostUrlPort}`,
  ],
  mirrorDomains: [
    "greaterwrong.com",
  ],
}

const URLClass = getUrlClass();

export const classifyHost = (host: string): "onsite"|"offsite"|"mirrorOfUs" => {
  let urlType: "onsite"|"offsite"|"mirrorOfUs" = "offsite";
  
  // Returns true if two domains are either the same, or differ only by addition or removal of a "www."
  function isSameDomainModuloWWW(a: string, b: string) {
    return a===b || "www."+a===b || a==="www."+b;
  }

  LwAfDomainWhitelist.onsiteDomains.forEach((domain) => {
    if (isSameDomainModuloWWW(host, domain))
      urlType = "onsite";
  })
  LwAfDomainWhitelist.mirrorDomains.forEach((domain) => {
    if (isSameDomainModuloWWW(host, domain))
      urlType = "mirrorOfUs";
  })

  return urlType;
}

export const classifyLink = (href: string): "onsite"|"offsite"|"mirrorOfUs" => {
  if (urlIsAbsolute(href)) {
    const host = new URLClass(href).host;
    return classifyHost(host);
  } else {
    return "onsite";
  }
}
