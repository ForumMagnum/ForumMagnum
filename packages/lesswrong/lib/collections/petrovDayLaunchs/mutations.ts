import { PetrovDayLaunchs } from "../..";
// import fetch from 'node-fetch'

import { addGraphQLSchema, addGraphQLResolvers, addGraphQLMutation, addGraphQLQuery, Utils } from "../../vulcan-lib";

const PetrovDayCheckIfIncoming = `type PetrovDayCheckIfIncomingData {
  launched: Boolean
}`

const hashPetrovCode = (code: string): string => {
  // @ts-ignore
  const crypto = Npm.require('crypto');
  var hash = crypto.createHash('sha256');
  hash.update(code);
  return hash.digest('base64');
};

const hashedCodes = [
  'AvcGHoz/uVFrJ1ATdxn7LqorZnt5Tn1GZrUvGKuoSDM=',
  'loYwXWYk+b3GAoZAoAMwOu94HU+20E5uRZikZACfA7s=',
  'rbO9EtP21lSkCuG6Gilp9Ot2NCq129cVBATRFXOmuP0=',
  'Q0wMfHwFbngOFLAocwbkum8JFkn0qEh1dgPavZ9AbBQ=',
  '3GHExjcD/rNZxgs86j/eP2o50ANzip+mTeFJ+xr8ARE=',
  'NGhs3JbJ6DwWA8ED73Ucl8lGzqpt9V219Ss+L0BAOeI=',
  '6S4aZ2zBeLpD7CxWQS+QDwMbAn0UuRNyUsA8av1MEVQ=',
  'JRiGuS8KipGt/m8MsFrh9zyn72LEnTHjAseDo+YtdiM=',
  '+Ve9VWfTOcvznWVFbCXCw6XBo3iC5Z/rue3gyh2nqQc=',
  'dBAs8IyTPLhKJadvAFcSGjM4HIkuZwe9cMK6NUxoFeA=',
  'nHEmfBqrQ2hmrSS6C8jVwWK3+uTMkBH9Y2aFScwLqwc=',
  'kJechqnx2O/ZNYZWxfSQ6mLX6m1HdMfWQpB/yEAHU0E=',
  'vZT3MYG8T3GbPCouT1uw9V4W2MiT93sxqE8HBCT9uGA=',
  '0eEHGvEu3hDg15od5r2rY2++jbrLA6FoGSclvManRjE=',
  'C9bxN3VXU3VLQndut/LUw2c45d27D+vjmLzWfpS8HrM=',
  'SEDWbAG/A9Ex/t2WynTKkjJK7WV+bsGOo8g71m36M1o=',
  'ZJQ5z+yafoOpq3NmFflvo43LJnljZBiutyiZGmwAUPM=',
  'cccf7e9T8MSYJSFbe0x+/YcQAaFSEmQ8ghYJMYTpSqA=',
  'bY49dUqpwTRQTG8Jju74IWI1WuizXNSNz7ppcXKJwK8=',
  'D4/T5R2Oo7cvvHw0qFZIkw1T6xZpsaZvwRTGmEGODK8=',
  'fTCoYwHdjPWOfhYDnkmjWyGrTOo3ZjWpj3EmsqhE9Pg=',
  'AI1hbl44MiXw4s+zTSAnVIMIv/umWeI16wZLEZb9z2c=',
  'K4nbPSB9/RTP+nDp5rAYD359vFQu7zTIsuGDzaSprso=',
  'N/lMQP6eKdwnO1RnYKHSe9PlJnBHQ99CWQnSjSCbT8c=',
  'mV3rIGWc9FdywS39l2VRT0vl3D3YkiNGkgRwGXw/Heo=',
  'ndYuvswffO3AcafIi7C/YfvpgsnWhL1ZxJDm1Xk4174=',
  'w+xUxceKs8e36uApyKOSHR2pVyhEvn+3391o02MH0HI=',
  'Lji7ASofxU17FW+J8FoxARkAfiFX9YQN5BTbJ5MmuZQ=',
  'kiPHHA8tRHPFXGK1lGYS6Wk6L57J6mDhk3yUWOPOWX4=',
  '/Yn4F5XGhl7DDEALlNwHY8h+vxjTOpyyRxjEfSLpgl8=',
  '6TjAGdYL/qlWDquEhgDxx4rHk7raI55QVkzaw+BQhjY=',
  'L63vUNR43Bg5G/NkjtalgC5N/vLMsOUfOSrdnDZD1gU=',
  'tjOckyvCk8IpMRjzi4hdPCw3PR5YRyDn/oMPUvQnVXg=',
  'zkVq/5u+iYHZMhcb5SM9PT0SIsV1dXZpLpzdfixKur4=',
  '/OMnRFy/TkyUicT5XWfbo0qeTLG0snL9xueKmfY9+yo=',
  'o2Z8jUYN7VIrJkGSFWRFjLB1mcPvY15N2Kc4EvZinfw=',
  'LwAkaBm4h/TFPnR8B6mm+b1Mh/kOGdwLjHil06oM4/w=',
  'CoGsLtve29+TTpe0oTR9wfpW56dho2S2lAGk1oUJZQM=',
  'mPkmPTS6SnC4laz4W6If2ubj4bEYi1A0Ora1yISl+pE=',
  '/pweszCa/TOutuqJMzLiBuThfNSxPwH9Cg3ZKITQt4s=',
  'aKnQ61Yckw3WuVcTLgTko+SoWBwZej8KcGjKlvoTmfw=',
  'QS0JaNbmTCieHpY7SmeCHYazvfn0o14CXEvL65bB9i8=',
  '/xAnIuBTuwq4fsxQ7XLAL9oK4iQsRLFWpRjVvCPQxRQ=',
  'EmOSACjXFB3M8Ta8YXsDb1pwCYZ/S716Xhi7YZy7rLE=',
  '3oUvu8NQx5IZ8dRz+b8px/xGU9S78x1zrc3u6ey860g=',
  'xsNMHpSr4KNepLeiXTYBjNC11mQIjqak6euBUlySG9s=',
  'sVd7FIpolwBIbjC3AxorSkg3e32vTrZd+hC7yQITR/g=',
  'Du9DwHeUeQPy6f46bhKXU5hAT2cH05eB96vsMckaixs=',
  'mIVt0T432zp0gUzj6BeZR+3NhArX5kYBWg/rN3XfPQk=',
  '9S7fcZijCzPSYiZE0j8Ct2vru64twg0Vtfi4bVmusS0=',
  'zL0qyilcQlKR8fJjDxZAKDAC7AKxBFZRZbBa+ncOf40=',
  'FvEPWRz1XR606uUmWUHzZWlFxXmgtTJYWb9pvSISwfw=',
  '947LN+5H4H9gYIqRJHQu1fV4HROC8tw7TA74VLoZA3E=',
  'AgIV6XdMT//a+/bB1+BmW9w6yGd4yYtTtiZigl/gC+0=',
  'Z/qytD5np5DUx1e/NcDEI3lzS9I9geztUlKsQ2rLgR0=',
  '+bWdM4sY7SGrsiPHxrMxmTIHNfoV+0HwE2gcqe08CPU=',
  'P5swrXRNaTiEbIqbt/sDoqV3gp5JA3KbpBewzVwgGJk=',
  'h0CBbl+Ch5Fj+m7mups9cAHYQwb92UjsjS/q7BXwxD8=',
  'fmzhG49KzWUVvf7+XHayExAFWgT9Ch3fUMAwOO1z/DE=',
  'Kf4UqQruZsYAls1pGE+CLIYaUVa7I6xmRlQ7hCisqnA=',
  'H7I3IQaBKUrh+OHV2JfzCzKPmJqH3llmkhFcwiiMnRE=',
  'XLkHun3MvKwhs7z6WbskRExzTOd1zP1AS21QYl2xCJ4=',
  'fa4qqfWAy763TEQUhR/oPoioOUNvVB6nZ+Iu+FdzvA4=',
  '8hjaElHRd5qlZJtXTPOFOVpoH9UScd3XBinf9q1dZIQ=',
  'B5vPQOqNm98VzAbdn3aoD8o3lCLScbL/8/s08f1705I=',
  'J/Y8KwD9sbumKs+b5fk8wxpCvAFtmxand73RWs36QZI=',
  'Ov+zB6Xl4WkZFKrsQFqjjtEFfM5QwXK1+1oOQ3QtUQs=',
  'x8Njbjwtg0LB3ORLz9v56ilU1h1q7CMJzuaAIGKpEFE=',
  'MyxXveJTDMBLvNBECPYELu/PerZ9S9LtxEM0yPRl0wA=',
  'l3S4b2/ZSXUiSlYTt5yHmnpZj0GvZsIISKPsARDKjIw=',
  'enUeT1sl/TOMVr2RUqqnBbOYglwDA1pPU/87ugfrxjE=',
  'wzS7lrF/V3LUT/CgTSUoQALk33f80B6F1VxTaqoQjuE=',
  'k5rqDYeO6FfUDF+IdLZteH6xIRiKGrv4IYbw186GFJc=',
  'U7YPMwQPBViTpgamAJoVS5aNiVXEq7fAd4wEdV0LchE=',
  'wmZs1/9jf7NCou68XS5hTEdH5OKExuAXSAb+LypU8Eo=',
  'OWSAP7+H+T2oMO0sDZHFyYBo7NJHB06xE4O93gF+9Lw=',
  '/gF1ES+vDR9PB1e6llLEDaBNYTVDt1onjBK3dTjJPNc=',
  'fLSKNlRsPLe7q/EqX0uccB1KnFMDPfkb22pXCaGX7x4=',
  'Wr+3H0YFCxIuQ+MPBv2MSPfnWDkCdI5lteyuyC72Vs4=',
  'l+F5dZROz94VvvShuTPOy0sKY5mh0miFTwaXlAVYWt8=',
  'iIwLPKvA8TzLkpNVaW9iuGEkDyR3AEFtGmEKvjHphoE=',
  'gYTVbdLFa2VRJOkr6R4wI6KFb1ufdAv3xJ4nKNIlzI0=',
  'MMoqpQz3C0z/mX0HTej8f4MytPrwgTcSdX7cQMsOh0A=',
  '7AyJsUzK5GDrTS6xyv88RmzSnT/X87fHZU2V0r3SJIA=',
  'V9E/mSYYRoJ0b5OG+Q+kfM32SsZsEqREUiVbmqqq18o=',
  'kD1GJbjOT4ChhEtsNjdSC+WOK58zDCS6Yw+6FJ+OuGI=',
  '8D3HqHYLsltdsGkoJ+xAwhU+3tnOyjxwWK/9RHOjwiw=',
  '+hs93OlgfJOwi/SFR3oifgvZvr2DN33vnSfLGo417EM=',
  '0bXH9R2BKxz/l2q+nbncDR0LuxWc+zcemNvPCER0ml4=',
  'nJzM5CPT49LCH5TSJnMCEL2h/eWOyyi9L5vNkDahUrA=',
  '6bp+Cg6GqZYBWFhdCdgo0rI/8p82eq1XuXnmm8PAM88=',
  'yqFfyW11k2H7Fn8I0XGXoCMIMUvzfneqSKuo6D/3OU4=',
  'VsdhtmwTcxutyOT+8qoEgkGuJcM7sgukaIsZSi7txQ4=',
  'yqcB3uMkSRDWR71MypQBzFAYLOf4+FcgJ34vmoaN3LQ=',
  '+rBFtZI2pXmpaZlWbhd9fW9ZCgCPxxiRx0WsHMAdB1Y=',
  'xTioquh6vZhF7iTkp4V1yRUIFeZ4alB4revN2fNrJtc=',
  '1XQHwXQ3ssKJBvg70C/qO3YFi6uibPropJ8Cm0mvmzs=',
  'PFgCSS1nH5nmo2IlHfSIPV9JQFhlai173bbzUEOvk+k=',
  'YCPequxOKKTATQAVT2XJb+3DwjBIDac/wpoBX724YA8=',
  'GOQq/aucbRIZlhuRWLigzRmf773T6r0jJbS9i8zmbCE=',
  'u/BDoP4cq7Utg1NbxYDfpNrVRmHQVXrw0ASfOBQlZy4=',
  '/2aX67Pzjqq/V9j85ris/HOL72XZOoAuEjk6yBhxjwc=',
  'LevQxdKmBAS8rj+Y7sPJUWYLsDEMdw33F3QujHVvFDM=',
  'E09ZkVheBy3Cy1sJpnfvFfeARiS42YyQyx4/+Ew4OAU=',
  'Cimki+32UUaE8o2c79M3byoTQakPUgVX9IGyIH1vqTc=',
  'utjUtZmQPLJuEDi9UqBW6o1vqF/og3y0UHhlob8ymEc=',
  '09lLAjEq3saLRLV/DLcCCkiYfNu17mQDYfk8d8Xj/kM=',
  'UwrPUoSsfWgXmGhkJnrzSwCFLoXC+kUlM7Ro+XQ5CCE=',
  'RVaw2miZthAu3+r7x6RbF6e569ZJ6UP2mXM+JviPATg=',
  'DF5lXWTKcbGmc4y2eo7kl3e4w3a86lOqOfMiyeBCpgA=',
  'XMR+Hqbrq+Js1E0m/+bFUoB+a1N3SZ0lBbEclXUDkok=',
  'bDzStvNvEb8M4bENrclP4kePYGU6HrOCmZFS6P0JeDE=',
  'SFWNdaP0v/1aGIFMIPMpHI5eZ2R5OHsrJEiPBNwr0AA=',
  'yu+JvhzTHFzAPU/Kjs0j26+n44xz5N8Kx8rvodL5M34=',
  'e04+UNM1S9TfClaRuE4w7Tvbb3k7eaNTgSH3RX6xIlc=',
  'oMlFSQLzjUTkMCRJYtUBPb4d/EsGKSJhvQjFAcpnd+w=',
  'hfw1k+c5hoVRT5Je01wmaXuRiPNjQpkTmG4cz0Na/UU=',
  'SsURHqsEe7DNXhW4oa2dgBttOY09E0yL8RXvcjrTT38=',
  'oQcOJU/PxN8ICU+TL8kvHt6diAGdQl1RUaBt+2u09Zk=',
  '3I+7JIWmSGV46PVFvx85MYe/eSRXEMPDHBB2oqv0kPQ=',
  'kgywUV3dpNEDNPKTDj6fYK4rYzgj4wksviO4e1eZzCM=',
  'pFPPsQTooLc/VZnmJf1AooCPkFeVrj84aVlDiAQTOcg=',
  'fDcu6PV67tkaIv5QMIDkWZOVmkuJSjYhR7KfAknh/C0=',
  'orItXRSbcsHzZDYvrCDJJT1rNm2bdc+5coqwT4gfbDQ=',
  '32kvw3VzRvOwOuTP6NJkgZ2u1isfqv2DRu/XUjJtElg=',
  'Or5qTt5FGYFuIJml03+4NYRE9YPnfu7TjQxP+JqBpYU=',
  '5YBWGfOtXDeIwpMk7JWdl79FG2o7NyQt4L+euY9b2QU=',
  'yL5XRtE+udybru9U4Gx2VPrD8GxtjuzFnzX4uOFPk14=',
  'Pp/gDJhfYlaz8kX/jpRILTdEECgPu28QO97OwpvK8Dg=',
  'nDUkaO416u9Mxk9rR31wKGQPtL+xk8JDxCU1xuI4dzg=',
  'Jgvl7ovEb5OxZ2/XbE5iz6mqvyTkFYADnsatEUTeDB0=',
  'fBgdC7JlsE5kXO3LZDMwB8IuMLLfu9p8NPCHpwO7Ais=',
  'aKDJwoqx/EAVDP6zLmxAVSqfZ+u9OgHqJNkfKexrqRU=',
  '9UiN6S4wMY9cIksZ0AcrXQQ8uVhTG7MGcqd0BtlyAdw=',
  '0IcobSYPUG21mU8+hJW7dcbVPOxXesCf08qn4YOC5fM=',
  'SY5CAuNJ/7UGfHJWq3sTB/0ayUqrfAnMi0P9VCPnhE4=',
  'TqGum5KlTXuxCtTwsa4hpfHlFZ1Xl4VfLa9TDBg9iRk=',
  '46/l+qewa81PRR1h3VS/HauMcHfmxhHDPV0NIMKelCY=',
  'BQpK1FZ3OB1OzKhn+BktyrXSP4ShLMBFgnJ3YO+PKw4=',
  '0u2JaMFAaelBU8zRzVOM5m23tWeg1zyzRHuxxZ4omJ4=',
  'up6bm5h+9nEz5OF+yVCFtVEbVPM8GEPitHuVl3U903g=',
  'XKgQRspd+QpjQJ8RSSf3k+pdW+vWIyTPgcxD6dDYH2Q=',
  'UJ07NwYp7ihDG8E6Zx4VrL1ZoAVjG/4axTvGlzZQsB0=',
  '5ux50b9ytyiK+Gf7kC3++70Wzs+mruqun+jzzW22S30=',
  'S9rdudCuFOruQKhyq2uCTfEUGcPe4s+j/6ySSiRZNQE=',
  '8U8SQ7r7Lp3/liiHR/taBFugoOkuYRhL7cc7bGoyN98=',
  'htxN5A6Db4r96QcPh5IcDi20RIlxuBv8oEu/LFwGqhM=',
  'UpfTS4JRtF0RY46j3DUB5fjeYHf7hEOlPYT7ww7UHJg=',
  'UcH5ot61xYtvJyIJQbi4n1QzLBEB3GvR3GE7Ute1hI0=',
  'WBbL53buzDrGaB8Ju2yVLq9AWgKfyd6J9R0GAGye43Q=',
  'akqwpM62ESXq6M5Kzm7O8C9eNChp7R25YSjaSUmttbU=',
  'W2j6Q9XiapfELs+Uoqwo4oISKIQxLl5ZA86+zX6iCRI=',
  '11U3TP0SKL9/CZkTH4j/LWxjv6OyuAmLJUNAbJ2C3Bo=',
  'N2aLPh4E3sv1PvxyAJiS11SVLpAMtKgv6wmtAFTHTcQ=',
  'gPgALaQINoGgd+LY2ZSndI4iri3wVN3SaTSf+HYqrvY=',
  'qoCwIphcQlyApcooVoXY8yCfQGdV9ZqIDyfrGtdR6eQ=',
  'GdyUHEZ2KDRgQh0kcHVVSzIfMYN5AQIAtOc2RaHuTZY=',
  'hzEaEsImXYEHevEgbqLcJBGdc0eOwU5636JHyriAeps=',
  'rLqDMjDK4aZcEMKDokF4HnmFH7OPx060TQuEslWMezs=',
  'VOkxZvfw5y4rJbtGI9flwMCYH0dw8qo7LcRmhQe7Y2U=',
  'A/9Jys9jLcGZprCtbyO1v2o74VRlLK4EGRBvPSXH1K8=',
  '/Qo82GwtW0QeMTANwwnP1GwsiGB8iqGPTO72gG4cxnw=',
  'g6KNEEwu+EALNIzYq9EyYAS3K1zw2JahNH/hNOgLiJY=',
  'TaV6DVZ3HgJsihYU3qsqju88Y36kzo/CwAaWkurbs3w=',
  '30AqeVy7+wg7TCYGjf7YaHQizHljXjATRa3Tm2QqB4c=',
  '5qOnqmGE4ElR/bVHBq51R54r9KXq7yiEA5Rn/W+yNxQ=',
  '0zQq9pzP4pWj4ispsG25mnPYwTX1P87lf0gJGNjFcyc=',
  '8ylNFVb5Y6cCuXM3peFgqiORfcnKMpDg4kgA76v8Dfo=',
  '6eLTj5pkxdXwyNwMcTAC+QmW26Rpv59dRLgOIm/1Ro0=',
  'JHw7D19aTpgKELSQgCPIhXCClr34oWkjpGfkY3wG4IE=',
  '6UlY9jPR8GnFDAhbiz6G5JGhqtN2vPW8a7AugdzvMyA=',
  'qIdDcqr0zMQUfjWf16lJ7SJbmlGIserEiGS14+lBJe0=',
  'SDXTMV58cBSMPDQ3mpVksQH972SQwzevtJa4ibYTzIw=',
  'jGjY2pklCiWjEt+QOFwpaV5QpdEzvwia0f1v895EvP0=',
  '13AqwOhSunTrB3SQ0UeHivJIOMIHuut/v0iFRbi5zG4=',
  'RDYboj/HXZAzG8viV/8jz1wbyav8dYi+AaqFYu3RehY=',
  'QRWER6WYYCzWS/khpsVgXInx+APnF8Sptlwuxy3WVgY=',
  '/Lx2wc3Qn9OyXlZ1uqXqeX6F9gTiLiNxy+25LZrxm4E=',
  'punXL4RZBr0mGJUyUg9KDoXumq9+wlvjH9XZsdja2OM=',
  '0QuXl5lZlRTjyzACqXietZ9NL0K7Wr2w7C5TVJ8jLLc=',
  'JbvQcV1CkUR6GmEY9s9HPERjWXeHrxdKA3KyejIJt74=',
  'DdO2TMk/zCRKMnJ29wusU0SnEDa1sTabEqaOKlo4DB4=',
  'iw7K0DeKIVpD7lEPuBKBy7VFcIIhhI1MLahs/NL6JFg=',
  't9MrKGWzrc+0XCNPQ5/YYmPjQZJbgHx28/Iq0PP29zc=',
  'RhtlbhetRpGChgV5OyU1WFmh9BS01VtpWLyXw7yhse0=',
  '8CJINYQFYFvHwEqSyH3uXAs+YzgxTivDeTOEyxS7KcM=',
  'Cuo4xCGTpr2iP9vXi+WjWK7qls+sTcti1wAs/Qzyc1c=',
  '3lSOiF/dMOzFm4aWcM7pOf4vxNxBgLqqfesMsMLy9rM=',
  'mJAxhmW+1tPqcZ1WSvCGPkuVyeaGBisVImxtoTjb5fU=',
  '2Oxwd+bPZ1w1Gz2wHe7zh1JS7r2BbsM39nZZmMSLTw4=',
  'p37BdBTX7pnARvvrlkZzDZy5Tfzz0o7HA3Dt0kOlIe4=',
  'HYyeyBWjoFWE+LK0rNkmyMbUiclIQJ6JN3qgsQdq5Vo=',
  'Xfi/Ye/2Q0SuD7faVEusn4xJHkEFZAT1msICPEBHNqc=',
  '/yBcVz6wTP6GRjtxBQPYpyamRQCITRjiTEpOK74BwZ0=',
  'oPRrbdawwO8Ty2bDXmihMm8UZ3E/AXHTAwZJIvEv79g=',
  'fPetzayvEYkEWIGmlSrc0oUY2Wpwf1aZpQGeIzj188E=',
  '4nTgmdUiJ1ZDONMYB4TnyldqxbHVkBQLUnBC8MlHlYI=',
  '/t8l1aPiyKXyHjmP2JtndF09zo1X++xbCgOdRYBpwM0=',
  'brpOZr2ahRFQtntq6Lbb5NVv0vW3IKvH37CbacRcs+A=',
  'l+NiPg3rtbT8jMn3aohfpbLjodBn5j+ce02Q+06/ctc=',
  'T/sxT4jUGqx51bztLfbq0u9Ojh2IZxc12kDMqUEFvt8=',
  'OidZp0Zy4r5hskwqoPnP4NOe124q5Y1gEnr3V2lh6gs=',
  'W+7b0bekYFSIxIUTM1wDcMyiRnrpBRb5qCILSzsK2qI=',
  'Jp0SVfwOlGovWaFIksgX72llnnTKRSqWJSCjuE9cpPM=',
  '2h3KQV3LlU0BM4WzDXJuqcnYlrqDvr4EICRa50dBRHE=',
  '7UXuxMUUCQ4jI4GhzuJ8KajRqydtb5fg6a9FAj1rsYM=',
  'L1+MG14KhA1lEKTfSoMqmft8SbEMKuDTM3Yb+FAeIOg=',
  '1foIWSKZnDvpeX1ovtVFmmunX/xZXTC/UKQGjybyZqI=',
  'kaTGz4ccuSTHG8myOXGJfHeO92+Z5yl+6J5trviJG4o=',
  'bZGD7tDpur074vktwYOqcLWloGOAGZu8G4+nRMIAVcc=',
  'L5LvEHtlbT6dAlOf/qCAkWQT34TOgDkkaaYAJUsWfDo=',
  '6i179d7uGVxu39bg7Ix/etxMwnGYNsoZjRBKDBF4f2g=',
  'IavbODTGyglit3JNC7K4dEHQbwO7Fow/WrcegBvBa5c=',
  '4AvadcGpwiYoK2hHBg1j+2h1xx/lZzI5m3wY8jPPm18=',
  '+IHy8Gu3Pw7TiXDo4paTy+/w2L0XDCtsRMnjkVnitF0=',
  'sCJQVz4fwuI2om0dv+xOJ1tpJNKIvF2aA2WOUOQiefs=',
  '+c9E0pdDC4aY5Z2ldLI+PmaZME61KNJkCrNBq5P97p0=',
  'DtS5J6mObWUp9+eZ6dmj0J/ii3YD7TWpku/yzQpq0TE=',
  'VDPDCrZQoDFHQaTL6XukqZjBpm5v7/AhuOMBnVWD70I=',
  'q7F/qGt6dTmsCodp21Z6i4ukhV6lG9cIO9QRQjesX1k=',
  'vG26r9aLeUEpxb3H0tXJFMvVKqJTE4OZF2manJKHhIk=',
  '468gDM5SZEVhJ3KAeFbEcdBZAbqRFwzfu6+I7Wivn3o=',
  'zC4mrnql/KA433DQ/E+myPm7QHZQCZ1ZCmQ0cXH97Rc=',
  'axRlFBgoFZjCdMhkDQ+ZkIicsWL/ZbDwz0qfku4r/WA=',
  'mE7XxbAe2dpOhIYqCia0ab+J5o5vm3GnB8el6e2Bm+E=',
  'HSyvnQvZOLVf3Aqh7cKH7ZgW6ELk6vX2uUFE+oT+PVg=',
  'gKgVfYUFoF3ae3KDFMBlNpp1gQasCt9BjZIQoc2mrs0=',
  'B09V2AbafD7nvm5GPP1bZjX6hp2jv59sstA4avDa48Q=',
  '0rBhST/L/fXErkj9SctOh4jTgmubGU5/FxXk5M6L1kQ=',
  'hwwFdntcU9gwLWl9ijcXnVLuKDJ15oIN7v/1lGX+GDg=',
  'k9tZ3rzvw+XxbRkm0QQkbb0HxvHrKEtnTbQcePRqdhM=',
  'Y46qRCW0zMsG296ffKZG8i5bwqvfDurrkoRchuucbOg=',
  'b4iRMHhS2vpsHYEExOdgKAeLHL+ywOP5/Ki6dkJCuSk=',
  'BDLMshr0T6OK/ZmVCq3qAClqADVPAX/vizswhd59L4A=',
  'U/ErbebSYSEyvNv9f3A/ejAdLGJyX9EQFTo4h6fzpwQ=',
  'Z5TDaajP4mb6Kd8uka8tgAQCW8jOI0wIFgIpQqcjRxA=',
  'rwQAe0cV2mAer19j1s4HawLfCTEXcJ/abd9rWGyz1Ao=',
  'y8jAi4Czw4/evT6cJ78+l2IB6eoKYtI3KloFkMkaffk=',
  'wtQ0lTDKR8592/arnBEw8uBvx252u0ThN6sr4tO8UZk=',
  'gtgF/Idlv6JrdbON5ht8Q3jVP6m295dXgMrRw3sF+WU=',
  'pGgMEmYe1vprZ3zmOukub2le9LLjB6WMlHbSsPOG4jg=',
  'KXpMKHDgQys+9Z7WxLZfXlx4ut3jI6iQx6QLBH81W8Y=',
  'CUDleis3DgXA11wQVsjwxZ74fQKCeMrpg+OW1vUYe5I=',
  '36J888B/FxR8WTnG1aPVDowVH4BIUuu7Msudxe3Rx30=',
  'B0KCdCdm6JHfoJmTm8ozXOrc7gLn9yT+fwvlpdCKlO8=',
  'k0PP6oW3hMzg0LI7WoH80j0BKBHYYNY6U6nsPLisTw4=',
  'j9WdGHClwRC/sT+0OXckghh+VdzN3+gvQ7FpWJB8QDE=',
  'm2MykCB8l1ErkQuPwuZsT6JoQlxZPLx7aJtRaEKhDEk=',
  'WfHMATDSIDKzOB55qv2X+OUbj3/M5sZSp3yUYzf1bNQ=',
  'DYOoOTyPsDO6j+jgsk64+eftNc+7ewABjHi2eHfXCBI=',
  'pICr/YDi6zojbZV6kBKmCYbCvk9cvkDq+aOKJE0HCfc=',
  'xNC1zqjnzAhOi6m8nzF4WnFWuvkrs9Wlu2sVTZ/ZapM=',
  '9gdZkezE4H9Bdxz7T7kBROeLPAAwG6lXghQKMiqApxI=',
  'fiEqIs0zUeC7dkaSGCa8KoyHE+vGhLKSozE9B+VhoVE=',
  'Q1mSk71ShJ9VAadtCEbRl6x8JvB80TiFG/Jvu7IkWR8=',
  '7zfMUUUqy7bO66yIBs0WImKv30vXhitA4+mUJf94hcQ=',
  '9zpzDZAw+YXwQAmb3qQMJEE9AsTeF93z7NQBHNkGQzY=',
  'UJk5McCz0lGDiym1j6AnVSEVdF4MrKgTdNTlmpjw3uE=',
  '1zfA8ump7Vo6u6Y5T1gYB3xNRM0r6cJz8/hPR2hRMz0=',
  '92cLmSfO7XdzPLMVRQ7gGdGY43j14WEz4L53PE04Cic=',
  'UGvzbgjGStIgFFd7wV1JjsQZ/GmuhEdYHBT87nnpOik=',
  'utwpwgU7j79Q3rBycLf/KvRJUBbtQb5Rv3/JbWLfpgU=',
  '1KAbC67gxQ1cyTX4AZzlJZaxNteXGpL0b3zyE/97rSc=',
  'CTe3LEIYI+jV5pNlsPAynioyapJoWz2i99HJvGIHlDE=',
  '5JgUBFEjh28dPDikRKG/sIe7YHjr2K1POcB0+eGkJo0=',
  '+ImV4ejKhCRDSoEaOHhZroe+VbGk3ibeZEPxzAps6lw=',
  'E4hLmOF8upcq2/F/lmadSJ+xLVOEB56Zc59vPFaodL0=',
  'F3CfpiX9D9FfS8roSxVbwKCUnmOiGgafXLO0iEyaEpE=',
  'qhMed3FUAjsjWKJ3BVvGH0L2oqyDy2Tl1QsmJRVFwyA=',
  'oc0H74s8s3mHXXUhstnwm6hspKjAtxj243gCk4nUJS4=',
  'r2Cop2unxY8UTbijQuVkV83bcv/lH/gkmytJMMt0LNY=',
  'KceZ/l00s6b6RjhBMlJduK2LspHGz51iY0RYljyd7dE=',
  '+4ZJALP/aZtorF0r54jH5WroHZs5yyex0EQWV/WpEaE=',
  'wRGu+zII8S6zzR5JgipXuszQb9uLdP5j7vhqNBSNDf8=',
  'B7s5r313hG4MAdapU0IQm0Wiuc/25QRC1tiXdD5uxpo=',
  '1ljkWvj3EpZZYO3MqnUmYFmiYyVAXK6ouKl8ftpdSy0=',
  'bLQJiU6zXFzvkbxdUvV7WBBl6ZEfhLgskkjwxhAY9ds=',
  'oFEoeG3I/rj7Bon8yOuNLqtg9ymowoxwTAGeYxyEP44=',
  'wNJIIjbWujP9o224+szM5KS1UYwG9wa4r0ORfCJ7+bw=',
  'S+E3tcbUXt3nSZghbr3cNPH+aFdJ8r8gi9cADEZGfek=',
  'i1oOe0jn/3Uk5MZwKT8FpiTSnkD+uGlErStgS5ElEL4=',
  'gpXH4tLOje0rQ4zRObR/Cq5TO/dZc7dwzTViczVvtxk=',
  'GxUsp/HSjQJ4VJnSP9FeDc5nedvN1soY6CjdGVnVPo4=',
  'yrcq2yf+D5wcx6lx8Y93urofVV6fRPubsTTIbHAx6xo=',
  'w+va82AfsGCBU3/hxlkMfCg7beRK14Gmcd/vxUyVgeI=',
  'AN4g0E3ujov6Yn3klhk8w/rZtHiGmK4n9OBckI+/FA0=',
  'g834lsVR02KWm4ziLOJd2pGiK4nSYFDs1xTn35wDnhY=',
  'O+E3a1o6verZyzow8JpPDDlMafwNB9z0zfX+RO6cuFg=',
  'vk2HlsDtraa0XJD0Nn9gqVMZsRXAo9WfypEuvfn8+tE=',
  'jplcymfP0Guw5Y11M03fjcJbRrlmOyQ25SZV5BTR7Lk=',
  'dt3dQntAM3IDUpexnDAvvAFH5R5H19TgbB1C1gxDihw=',
  'RHJ7JFV5EEqHvqbuDUiOyKKmcFOIjRkjOiv/T56uaTU=',
  'RuGH8fl8t86g/2V1ZGM+/jaS5gVDLR99r5UrRs1frbg=',
  'UfolDQEC28uo4rfc88ph+naW86ZbKnxP/yNMcJPpGrg=',
  'S2hqp7YS1EvDbAWRQkjU+9Os4TtHIV9xKLpLU6C19R0=',
  'X/Nmz23dTaMypSuNYG/31+Y5eAR2o5uKISjjBg6I05A=',
  'qPkiLjQ2w4IVPkA5VXGFhzUzHJHqpmaUiq7PnkDn5tA=',
  '0tMi7q9WyHytCAZbzyu+O3Aw1XneNtX+u9Uw6pnUzxM=',
  'g4Vti4y0ZXy2dLpnyixzFNuO0yZP1EvpPmBsEyRACXI='
]

addGraphQLSchema(PetrovDayCheckIfIncoming);

const PetrovDayLaunchMissile = `type PetrovDayLaunchMissileData {
  launchCode: String
  createdAt: Date
}`

addGraphQLSchema(PetrovDayLaunchMissile);

const petrovDayLaunchResolvers = {
  Query: {
    async PetrovDayCheckIfIncoming(root, { external }, context: ResolverContext) {
      // if (external) {
      //   const externalUrl = `http://lesswrong.com/graphql?`
      //   const payload = [{ 
      //     "operationName": "petrovDayLaunchResolvers", 
      //     "variables": {}, 
      //     "query": `query petrovDayLaunchResolvers 
      //       {\n  PetrovDayCheckIfIncoming(external: false)
      //         {\n    launched\n    __typename\n  }
      //       \n}
      //     \n` 
      //   }]

      //   const response = await fetch(externalUrl, {
      //     "headers": {
      //       "accept": "application/json",
      //       "accept-language": "en-US,en;q=0.9,de-DE;q=0.8,de;q=0.7",
      //       "cache-control": "no-cache",
      //       "content-type": "application/json",
      //     },
      //     body: JSON.stringify(payload),
      //     method: "POST",
      //     redirect: 'follow'
      //   });
      //   const text = await response.text()
      //   const data = JSON.parse(text)
      //   return {
      //     launched: data[0]?.data?.PetrovDayCheckIfIncoming.launched
      //   }
      // }
      const launches = await PetrovDayLaunchs.find().fetch()
      for (const launch of launches) {
        if (hashedCodes.includes(launch.hashedLaunchCode)) {
          return { launched: true }
        }
      }
      return { launched: false }
    }
  },
  Mutation: {
    async PetrovDayLaunchMissile(root, { launchCode }, context: ResolverContext) {
      const { currentUser } = context
      if (currentUser) {
        const newLaunch = await Utils.createMutator({
          collection: PetrovDayLaunchs,
          document: {
            launchCode,
            hashedLaunchCode: hashPetrovCode(launchCode)
          },
          validate: false,
          currentUser,
        });
        return newLaunch.data
      }
    }
  }
};

addGraphQLResolvers(petrovDayLaunchResolvers);

addGraphQLQuery('PetrovDayCheckIfIncoming(external: Boolean): PetrovDayCheckIfIncomingData');
addGraphQLMutation('PetrovDayLaunchMissile(launchCode: String): PetrovDayLaunchMissileData');

