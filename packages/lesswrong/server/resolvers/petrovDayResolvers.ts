import { PetrovDayLaunchs } from '../../lib/collections/petrovDayLaunchs/collection';
import { addGraphQLSchema, addGraphQLResolvers, addGraphQLMutation, addGraphQLQuery } from "../../lib/vulcan-lib/graphql";
import fetch from 'node-fetch'
import { createMutator, updateMutator } from "../vulcan-lib/mutators";
import { Users } from "../../lib/collections/users/collection";
import { forumTypeSetting } from '../../lib/instanceSettings';
import { DatabasePublicSetting } from '../../lib/publicSettings';
const crypto = require('crypto');

const petrovServerUrlSetting = new DatabasePublicSetting<string>('petrov.petrovServerUrl', '')
const PetrovDayCheckIfIncoming = `type PetrovDayCheckIfIncomingData {
  launched: Boolean
  createdAt: Date
}`

const hashPetrovCode = (code: string): string => {
  // @ts-ignore
  var hash = crypto.createHash('sha256');
  hash.update(code);
  return hash.digest('base64');
};

const forumHashedCodes = [
  'ef6T1ROGkI0sN39TBatLPL4XZfZlLzWNvYuzrq3a2dk=',
  '5AHNLhA3alzr4sVfB0YVSlPzMoWEbkXcCaE2HVJlgB0=',
  'm/lFQrU9WVuKzeOYHDm5Vo7UPQqm6KVd9NyTChHjd9I=',
  '/gEMTsEWF+Lku8Rzyt0gLDraNGl32PZGiENeqzEECEo=',
  'HM0d8XRZkC0/icL+3DXbUFOfAOlQ840Cj8kqme8rd2k=',
  'MMm+T3F7jPd0OOBJFTKAEfXkeTLiRnl5kpcAXPXoiig=',
  'jW829owVhuW5K5O3zzAorUgwkNRif+NR7FOwyTF0Gbc=',
  '0PItGsHyaUItKYRDLT8nYxT8xCYjpbteft/LQU7W5rU=',
  'OmIqpySr9eCA2g9uAG3OzxzSWvvZy9teo2D2ziyiZHU=',
  'ck5s0n4aNuKqi1jp2TNgQ3iypL+0ic7oS7Ydk2J+2hs=',
  'c4dzfVSlBgNlQOxDIkvELVTic4vcbH7eRbMLuBrbvhE=',
  'o8G6ipbl/mY2a1Q8anXbNadklY3GJm58THla4e0Ot24=',
  'FrevUhDf2XMQumFMjmHdVzPwPf4HbVuW0LVmiPUxz8s=',
  'BLGmqJqdN+UJZL6OL4uP0JvijGF1tWoWPy+yr2RjglQ=',
  'R+fw8YA7+RLLARjxyqNIJ35CzKG13W4S4S+mTYKSaCk=',
  'H3HNLFHXhApZUt4DMMUZhyAaY/RAz+wsCdrssa3GUxw=',
  'JGh9AAlCmxuveJGRdrE/VffCMHgv5BjNL+MK5/YTFDc=',
  'BYy/XHy+VLUj0aQgiUO/PMIRp8yM6SCG4ZNJdQxtMNw=',
  'RIUyR4rIdROz0zK7OqZgbcZNZ6GrXbqQMe/Tdqf8m8o=',
  'N2aHRoZnNYkeNtt5aV3Zk+8KP1XI8Qy0z7ByD2+ZumY=',
  '2ythsTJiU2xqibApglGh/+gC9Ls0zsMB/6eXeMQ7IsY=',
  '6GHx7bvIs+qCtM5x0o1W7ajUmJDffBuHYjDdjXCAH2E=',
  '7vXiiS/P07PpfFE4F96OfBrgyvoKYmHoPb28ITVGJ9g=',
  '97iTxf81grloJsf71GXd3JlNS1DDTfiEa7igMw66UdM=',
  '5m44cWaNb1K8z+euQ7EMjtoUKaDCjZDnEMlXmolmzE8=',
  'K1hZUYj2OVEdL4kb4JyWMHvbGJL7HKyWkkUK369WWZs=',
  's62CW5mrqWJHvM5rYWGhvxMtFrqmeuxJNL/Oqrj4aPo=',
  'XJGeMBXE8uaDONfCpK3gsoqRdfR0ylJSjsgntIF/zf0=',
  'ANhWUsXLCLU+29AEaS5zxsRPPO9EPNfRcusCMNfuid0=',
  'QCplkyWM68Usm2Io7F3QhdyPnBBb2ZRxGfL0Vz5s3/4=',
  'gd0s/iU1F237vOHrXE5gzfAVId3kGLjeyavBzlaSfIc=',
  'BgXn4eMc5ynla0340pZzJa/8rbrreDmk0H27ndfNJwA=',
  'Uz0FghvsxIpFMRG8X9EFuneyYMQJGQAoWwN4zNLhxTU=',
  'jRbWgEqfIoXuaYnHsIOkmQA8gQXQ1Ec+kbgeGtYCtPo=',
  'RVbhUHraeGcYkHQxcbgHJG9S6KQk6hpYVs9aSRnOu6E=',
  'dz0JI8ymP1r5tf/+me2Pj5TN3arCgsIaT/j2GGJa6+o=',
  'Q9m70coAne3ViKWZ7T8tyOpHRqSzp/H6R0dDrFvIfaQ=',
  'jC9cY+0aRg7GL5/D0fAOCp7I4I4+Yl0BfanMKabR8WM=',
  'vVk+JAawZ3PJIEx9EiQrAZadH1uVLNC4HlnzkuoO+jo=',
  '8kG4dZDJVo7HhLGWJuolXRMk89vHxSQRc1efw24zz3s=',
  'j+sghXvPDiQtx8FHVQA7n/2O6MhbpKp0K1uVR9Io1Hk=',
  'S2qzjImrQ7Y49YG4wGmTP/RyY7xQwtxEgtgzIelNeK4=',
  'Tlkq8egi1vioU3ubddu1H6gqnyQ4QsDe+V3Ha+1VgGk=',
  'EKYMbvRVfjiSpazgvZo5Lc9y8yRLdgJ1fMxIV0jQO/4=',
  'Y1LTnbew4d77jxlcDg4VzHUMc5EH4KcfBK8zbeDQ9Nc=',
  'h4QvnQAxcpfVUCIdoGBd90GTs7d19Asyeedjq/4L7Cs=',
  'do69buxXB6FJBxdYs2fr+vx0vlQpxEj/Iy3PmkC05Ic=',
  '2sjum1k8/S5DpN36T1XkjLuh7Km2T1wsw/RZLxR52d8=',
  'LszwTaK5MfG+xqSy6t2QWESe5m/vyBX9L+VduLThO50=',
  '+k7jsmljg/iGNEs5Prflc0G5tjx5gs1Al44OtzJ8wHU=',
  'mu8mT/FVrjBc2t0/cvvqpZ3bxNIzcYFVZ/d4DXz3D7M=',
  'vnWkLsJRE9TG+uZbxwhvTUA8M7blkw4bdymUGlVmYOo=',
  'ros7maFqD8FMa+yLDGBRB7E7Sw0DPoi03JYOJJKuWEs=',
  'fiSfQ098yOk3YEMT/+R6y46rwkge0rSNKKI5ZTBUrFc=',
  'U4xLdZaw35n0MqKQo6gdQfaUhw3CPg9qsmrjU9K5euA=',
  'bHorhbbgltkNDOOqgyST4Vl/I/0Fu2qQnSgUPfPXSJM=',
  'IBB9sly5HMSuOniAp9GbOdFBVZQkb+nv33Q0azV3ZYw=',
  '8dphXR6W/+/sLZU55L/L36JDsRPA1+lI+ExZJMUijXM=',
  'gMzLktAaeSC5Lks9yUZISoNOZXh929WfoRJ+6vdxzes=',
  'wYzeOd2ZEGiGPC8k2XrCYEBjMw9qX4KbMT1s4fnxngs=',
  'cvwln9BfBBtdgPSv5b4CJGjZ+A5d9JxJbDNddJaNEb8=',
  '+om7/IFJsUzQoRen3S0k7e+C215t6FvlYV9xuMZ4JBE=',
  'KuusWN9PkYxsmivQG5aYNWtF658yi8raxbgX94zSwTI=',
  'MUV1fkrvxSVUDahOxjOc6rDFeqCaiepyAudlqHj7f1o=',
  'mHJ3HmZGbI0AFr8sB5lz+NUQIfZrKh4Pf+xZaumONl0=',
  'iQCqev3NU/LEJBqZDa4osVZJ6U8HDVfYuM56XB9FG1s=',
  'vmB6uyV1OwkqaVmcjTaNtNRO3pO/zRDX9HbMdwAG4DQ=',
  '1bTLW6Xbl++l1gsq/b1vInRlKg/6HbESI60lfUvEp+0=',
  '+m7w3srTzN7cIr7mGUAmYBK9E3VwMIlJogH4bi8Xuqo=',
  'sBdrvSKzP9jTTpiC7kPhPr/DVPMEtUkTca/vIzF38Yc=',
  'YxI/uI6utcOrRt8A7Fq/SWDidrIS052NhiPez8jgZDU=',
  'q/F1+HE4oB1FvPCp4F/Q469GXOUxkOUa5VSFclcpDtU=',
  'F6eFThUTkupsjMhg76nmB5ufjamwpSesCOq8ohpFxkY=',
  'xwV+yIjm7BMgwlG0n5iGSYBcLcpDkVqjOGF1uzOVQYU=',
  'boliUhh4Z0nizTePRb0MnKnt42saDOFxBuqsdBlada0=',
  '637sNejyvRBDbZ4doIMlnnUR27NUOkKdvC2pFLP8Nj4=',
  'KbCS01oKM5eCzmuQ6/97+BefJtYaUCwYmgbY45Xxg4w=',
  'XpSwPiZ3AbS1+ojdDSHeKVFqW8eI9RpkRcjU7Qbd46o=',
  'cyAh9eX6YZiwRu0vAqFIZZUXOfXQkVlz+8oY8bFXiCg=',
  'WDvPz5E0iKCZZcxaOTzom1Cjlx0ccPy6f500VyYPnF0=',
  'GSL818uM1de6R6RpdjyZaJGmzxAprCEqxaTobBbYguk=',
  'B9vXw6wjxapDjkmXg0AY9mtOIQi2bRuIhFBfp6yrMww=',
  'cbzzacaoUn+rHoXHZ82pQTIivoKpETJywAelVhrsnsU=',
  'AGxlGF981Uw445iJ+RhXE7hHdpHbjpFWgrKeWV0ugEM=',
  'jPaWwHT6hQKrkMcjtO6iVym2W93Cjt9+CjJ2UPm0k4g=',
  'NDEZjKW6u+5SbLfhMQ3WlB/L2wf7wDrhBdZSTJISlBc=',
  '4cyO/1odQQrI95Wql33FVzn29c/WWEUm8bBnOTB8SnQ=',
  '3Mj3kdczHLNUmpyJFb+HEraBHxO3AyaL8GDy3ba63qA=',
  'E7J9W8NzEc/iy8fuc4i0f4rcEyHQs6NJHMtp4trw1zc=',
  'Vr+h7TqWIXfcXWyeW2xOgOcaKbi6dYJfM59RWMFNx6w=',
  'lPm+Nj1z5J0GTY+QVFY7ynRDHEI7RVFEyXOTm39ZZxU=',
  'YcReM6NUAqYuM6GyHmpmjUeT+p4D4wIff+rQsalPeRk=',
  '/Zn/W2M9I4cHQEi5ymEaa1znLcmbQlqgTvVY0J3xyvw=',
  'ePNs6UeQVyG9TfuPJMGrT/CAJoJgufMnkmkLZpJD+O8=',
  'fbLgCVLBpq1S/SmLKCDK4solc0hahmsD3RTp5CXYo3o=',
  'LBRUw0WIUfhoenU1d7RECgqFFcQsplYSYIqKdjbiMpg=',
  '5+Nm+3lrnWB4kAxYCk/29m8OM7gJdS1CngohVCYK7Xk=',
  'O5RGqC+VkvsTpqnrLpy7WQlVpmXWRq6P0l1sOVpqucc=',
  '/mrnIdYCTOzBSMq38YDERUB7EEzWZxUyp4ocCx1ax14=',
  'hEbhKz9mw5GGU4ygzmcLPpP3h0kNDj88+vFAMkE76fw=',
]
const lwHashedCodes = [
'i3pH95ysIKBowmIUFMAGMbmJhJwcqnNIO+YCLsuYt1c=',
'pTEChqMK0tOpCbTwEaeYebCxt2eTa9rO3CEqM4MZluk=',
'ctvsWj3/Z4DDNbisPXNEK0F+8SWgKium5vnTHmBg964=',
'sYtpn0T5nFt4L3DC6CiZHzEMon2xno5HURCEu2zdykc=',
'w3+28+TAGLkeIrQaKtWj7OJkSIRi9y51TBVTbjrua7w=',
'gAhauiEj4fW0688g5e0KfMeaZ3HrkV1LNAFLgAZGd6o=',
'XzwteDJlPH4BWxg8Sp3c0IuMN/sqY8AoVFWLQ4Zenck=',
'MDrneO9VWENbtKaL3BEipWDKJb0CUK7QA4nT+TO5oSk=',
'9dJpYRsJYsUxORk9B3GCQr9tmGHoYGKEH5jOehRocEA=',
'iE64OWgHst9bmaI5+V94dh0e6m9L3Lg40L+Zf3/Pk7A=',
'G2+03+jTgPEJ/YsTCjfDtUdHwsTt786KZKap4LcR9M0=',
'qt6AVv6MdpzFw+B8eD/r0MNsnh67EucT4Z10yc2ce3g=',
'Qop4d68GHJjBpfgB0DJS2SZbkD13huznpZ+IhIBsJcI=',
'4v6bvCaCtF0pPY8D7gGTfTgylUpsbk1wI60DeVII7QU=',
'hNCU4qQd8O51ZZMceAuCEhvIbzWCuN2g0SZ0bD0wZJk=',
'fOPcWNo3JvQqtu6JpytRTXe6BwgTR+w2Tvr+IkkTqy0=',
'ChIZLjiJwPFQcRnlRsDL9QJk/y1udC84hWgM6BUPAPY=',
'tTo08EfiZtHwywws3BMBlo2CI/cncegWlpqOkgwL5Z4=',
'Ys/rwsH7oPJhcQzWD3SvUTYN5QTb3+2SKO0um5Tl0Dk=',
'aervj6cKLC2YQT+qDkUWPxyGYS10UIordf6hR0GkOZc=',
'T1P/foGSoDCSy/5mmr3Mmcp3B0P+2fJrtVEBo36ObOg=',
'jhPbDHs5wi4KcVTqUCzAQ08TdZaYjsXMqdIJMtWWasI=',
'h+idsoop8rJraeU3CPBaRJe1ZcU6H7OXOxM/pJJgDvc=',
'RR0YAR1YOtn6b/vG+2jbSWpf7Txwt3JngGblbW/t+ks=',
'oERvlVqHjnNfiV8a1qZNbIBAxJN9dZUwTMyOMGvxQ1c=',
'gfgoPGpzEVf3Y2hhNOrFD92PItaWaQKPNBsE89KLmbw=',
'N0BYs9zyfLonQDuToXHcaiYIQmk1AZra3NNC4AGL4hE=',
'2JYmOg+dYY1NBoJSD4xjrbTNGQNhfUa9rqcOTIc0sfY=',
'TSjJS0lqZUv4RGQISk2iKE5FL31kMKY7RsE+rNRPUWg=',
'6FPP/hN/hXvziU+ZV7grgmCvSfj3PmnnkANF+bgqGQQ=',
'uLmZiXv/iu2wZXuZLQrGDsVtB3UUZrzaGjfWP6pE670=',
'VE5TpGHvs5u3LkKc6HCalFm7KWwhY0iJNMPHfscyOhY=',
'PGfQIh00YJTtt3euKeFrlhURR2cDxewYHcJkyTvP2xY=',
'VmE7R6Zph+p1EGnv11+qzzt05FyVhxcSDwpvaGpHnf0=',
'+aWJKGSTcmN2MQH2fl/pGZCovOnM3Jdn9w9MhrQeRCk=',
't2nRga5nhKEXsXyo7D0On+fP4Q6vrLbrm1Qk8QvKhVY=',
'cctTVVJtWFyNPZseISR5jL2hZAmvYYZVUTgtMHQljBM=',
'ODax2ho/L0N//EXDcHr+QSi4KV77ffPH0kYBwiY/6hg=',
'NQVAkDT90xXTJyTSBnG6aZKOQvStPK14bVO4arw7Z5M=',
'fpRnkRK6n7wY/UxkXWYq1jy7s2n1SAwwkO5cED6WnIw=',
'O1auCohYpolHo5VgMcNeA4fEIyxDojC5mTGLFes5eNA=',
'Grkf5SMgnASJ1+/0FE8hhQbVmPd1X5Ec4D1g79yfdJM=',
'iZhv+FdmL2LhfjsPtzWnbcVG/Amgahr+Kan6rcaiABo=',
'mUvIXEyIVZQJpPVyhyQvqiATGzAuma/M1OpGrmtXHFo=',
'eN31JSE9UREccDgqrziQ1enRtxUlxt50WMXLKsPbgvI=',
'5SaJ51TZ0T+IGIMPaWWG+2nPj1h9ThWuI9zLfWo5ObI=',
'ouj+UbpMjlkjNm0v91ZEesCzYPH3E4bnGDiwsls6obg=',
'MabWRIZmRSp8HRD3gWZaYHgqO/dz+UShx2r8Vhwg4FY=',
'NbowSSRQr3LBaNtc3f3DrVmH+ikpK7RC/ZRiJUJRQAU=',
'e69UG5TiqQm6SLBiw7+pN5Xv9r3izjgpgi++xtA1eTA=',
'8IumLNXjFb8WfJBrrRInuUSR0NzB4pc1dYucHFVw2TA=',
'PxUGl2kP3I1lYx8KEgAzRu75v79HevK5sKEnJ3874WE=',
'T/jH5FGICjFiqZcn66Wo7FVCfH0YFSW01ptjSeU4mcI=',
'jTMGFIud20m0EYKTG5rGosRHXRVOL+sZEYxOa6XL24c=',
'1Cmt1F/g4f9VdtCvTtHMS5inBtmkKf2qBrDBwu0NPos=',
'ffVlm/w6lDZJyK1AeJ3yFY+r07nXoGe/ornB3UZuBYQ=',
'anQwhb2MfSNyTRsj8PZ3qMPAcA4siSp8ZqDL8yv1AgQ=',
'AmlWfqeyanpx8rdvrS5BeRwnr1IXQT1lx3TFIRwIfCk=',
'OqfbAlBI4WW9yL31+x71svBlP/arnG4NdoooDiLoFAY=',
'cQ+cjesMV1SxpdXsgAJObuSBUsIyXvwF1TDfpGqyL8o=',
'r7t3TdUy6ZktEjH9S8xvoIHz/AGq7a8KploL9Gr0xP4=',
'XtWOj1Ui1ao0QE/sebpC+zLGXzW8/C7cNBkD8VhpTxQ=',
'4ckaQGA1o5qyXQYH9v0e637RR1BZVMRB9kQH726QYWo=',
'xO4OsUN5HYwWa/UA1c6SZCqNcFbh4jOt41NQQejLSKc=',
'nVwzQFBNSJPPB2/cM1WnZgoccrOKEWCYBMeNpkLGffA=',
'DA6T2VcVizGmaxlw4gc60sAcPIY6402WAHI9448toQ0=',
'xNUWQvrxk8Hk4oGFhDjta8o6X0+c07MnK515SjYlybc=',
'DfQ+q7GI9HXzELb1yp9tUslLEB31L/fD2MmanPQMUOY=',
'70nk6qLlsLXqWzTLSYqWmI9b4Ewa3YtUCZQzzhf0A3o=',
'lYPL1nvYQOn+WcQ1Mg2StCZ0fCgqh/BzLXXowaSP/fU=',
'p4FlBadjeHPyRzML9+wbQEZWJap1G1Igcxf/CkjSG9Y=',
'i9GIpwjDq6YSZFNJ1s4UhYwCIDUqPdhyDBxU5R5YghM=',
'weEwIJykXQXBNYTlvBv53krPhwnvWjpf243fBXPLlTU=',
'0LlODGHCF2r3BbgI96rqANrrkzXOLqNkYD9+oSTq8jc=',
'1Y+Pq64+U7LqWN8zCzX0ZXutjC9DlH7o1Nc7Bi3/IUU=',
'6iIxsxl6Pwabjr1jC6eZ5kObMGw7lZsAFcDs59V/bNQ=',
'Fn29+GZGAbE5m26RT0qzCiyn4Nz/c8gGl/LIMuihItc=',
'nRgxEV5DWc6LUaizkfU2I2nsfkHmphLUFphCCFrR3b8=',
'MDwLhvM/EH18tj6lHW7QOL4n+fKE7UisCp2GsKLgkIw=',
'1UBHPo4xqQoxhtsod4tE7jNTMA/Tz8WBuHKomC1w320=',
'vjnFrFHZP2pTd7i/xbl0BQBZ1nBrAUlxxDl14Hqbua0=',
'd9rVRw/4Q/oeUUYdHSE6rCcHj690f8T6uBQ1AbfKU1w=',
'KLDGD8vIRQIJw9193j4CJ/ZZ7C5E549v2J60DJvOXZ4=',
'6EoS5YnWEzM7cXitE4jj4BFEXd5g6VeMaqF1r9bDM88=',
'+xS8RjhOfdnld0BgxKnKDE763mrpRrCxohvAb/5ODpw=',
'cxpBa1x9hkFyo2Ir4D3zJR+OhA+hxiVG0FnlYnc8akk=',
'frmVevyVZBHW7ljidfsnRBRPOvHe3hhORfw8TcubvuU=',
'UA4Vfl8vSuCQyehLgt8X9obXL7eBRhtIva2ASlcjvFQ=',
'EUZpCwsYKgONOAwkTZLPyfP0STAV8pRRvkhXeVbH6WQ=',
'sESZ7jTP085a8j3d7NtajOwoktiisXLkYQpWaxxWNAo=',
'5HjMKMajtH/OPb4fVxHssBpUHb95ekBFAyRYAn09vcs=',
'nzH/w+tQCKfN1gE8QZXKHKL2HXIftZGSwwEO6TguxX8=',
'Wq2KG5mN5KY1Bu/Mk2WzigEyeFI9XN8n7AuMWeirS1Y=',
'RUmomUzrqV14ed5ccfWJdZGfjGeXcpo3qllYVgj8pag=',
'bshCCNtEu6nElqXpBmpnFoszyZtjD0xKipCQZGyyHyg=',
'aXWOGH42pBiNwK2vvSY6ylS3nnMrSyXRs5gCYFeJxtM=',
'DZd6Chdr1LOIu2XiAoM0IUtx6Z57DdYYuZjNVRguXNE=',
'EZxDjUDrqBQ5PJrgCxJINd8FM9cDraSts3HvpymCXS8=',
'ICQQIFipZT/mfaa6sh7lZzwN2mHGAyGCeq2sGKN9myw=',
'zMQms668WquLLq0W6/WGEDzeGBaglEcmXWvPea5Fyrg=',
]
addGraphQLSchema(PetrovDayCheckIfIncoming);

const PetrovDayLaunchMissile = `type PetrovDayLaunchMissileData {
  launchCode: String
  createdAt: Date
}`

addGraphQLSchema(PetrovDayLaunchMissile);

const petrovDayLaunchResolvers = {
  Query: {
    async PetrovDayCheckIfIncoming(root: void, {external}: {external: boolean}, context: ResolverContext) {
      if (external) {
        const externalUrl = petrovServerUrlSetting.get()
        
        const payload = [{ 
          "operationName": "petrovDayLaunchResolvers", 
          "variables": {}, 
          "query": `query petrovDayLaunchResolvers 
            {\n  PetrovDayCheckIfIncoming(external: false)
              {\n    launched\n    __typename\n  
              \n    createdAt\n      }
            \n}
          \n` 
        }]

        const response = await fetch(externalUrl, {
          "headers": {
            "accept": "application/json",
            "accept-language": "en-US,en;q=0.9,de-DE;q=0.8,de;q=0.7",
            "cache-control": "no-cache",
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
          method: "POST",
          redirect: 'follow'
        });
        const text = await response.text()
        const data = JSON.parse(text)
        const createdAt = data[0]?.data?.PetrovDayCheckIfIncoming?.createdAt ?
          new Date(data[0]?.data?.PetrovDayCheckIfIncoming?.createdAt) : null

          return {
            launched: data[0]?.data?.PetrovDayCheckIfIncoming.launched,
            createdAt,
          }
      }
      const launches = await PetrovDayLaunchs.find().fetch()
      const isEAForum = forumTypeSetting.get() === 'EAForum';
      const hashedCodes = isEAForum ? forumHashedCodes : lwHashedCodes;

      for (const launch of launches) {
        if (hashedCodes.includes(launch.hashedLaunchCode)) {
          return { launched: true, createdAt: launch.createdAt }
        }
      }
      return { launched: false }
    }
  },
  Mutation: {
    async PetrovDayLaunchMissile(root: void, {launchCode}: {launchCode: string}, context: ResolverContext) {
      const { currentUser } = context
      if (currentUser && !currentUser.petrovLaunchCodeDate) {
        const newLaunch = await createMutator({
          collection: PetrovDayLaunchs,
          document: {
            launchCode,
            hashedLaunchCode: hashPetrovCode(launchCode),
            // userId: currentUser._id
          },
          validate: false,
          currentUser,
        });
        await updateMutator({
          collection: Users,
          documentId: currentUser._id,
          data: {
            petrovLaunchCodeDate: new Date()
          },
          validate: false
        })
        return newLaunch.data
      } else {
        throw new Error('You already launched a missile')
      }
    }
  }
};

addGraphQLResolvers(petrovDayLaunchResolvers);

addGraphQLQuery('PetrovDayCheckIfIncoming(external: Boolean): PetrovDayCheckIfIncomingData');
addGraphQLMutation('PetrovDayLaunchMissile(launchCode: String): PetrovDayLaunchMissileData');
