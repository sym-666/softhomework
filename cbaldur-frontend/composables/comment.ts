export const useComment = () => {
  return useState("comment",()=>{
    return `iter058f ITER
T_edge = 1.00, n_e_edge/ne-bar = 0.75, <n_e20> = 1.1
100 MW NBI, 90-150 sec, Bt = 5.7T, Ip = 24MA
D + T w/ Carbon + Helium, Zeff = 1.5`
  })
}
