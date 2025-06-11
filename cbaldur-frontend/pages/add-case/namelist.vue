<template>
  <div class="w-full flex items-center mb-4 pr-4 space-x-4">
    <USelect v-model="selectedSupercomputer" :options="supercomputerOptions" option-attribute="name" value-attribute="id" class="w-1/3" />
    <UButton @click="submit" class="h-[40%]">
      提交
    </UButton>
  </div>
  <div class="h-[80vh] w-[100%] pr-6 rounded-2xl">
    <MonacoEditor class="h-[80vh]  bg-indigo-100" v-model="namelist"/>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue' // 确保导入 ref 和 watch
const route = useRoute()
const input = useInput() // 获取共享状态

const supercomputerOptions = [
  { name: '后端超算：Auto', id: 'auto' },
  { name: 'Hubei', id: 'mhd' },
  { name: 'Beijing', id: 'bscct' }
]

// 初始化时尝试从 input.value 读取，否则默认为 'auto'
const selectedSupercomputer = ref(input.value.supercomputer || 'auto')

// 监听 selectedSupercomputer 的变化，并更新到 input.value
watch(selectedSupercomputer, (newValue) => {
  input.value.supercomputer = newValue
})

const namelist = route.query.namelist?ref(route.query.namelist):ref(`F  0  0  0
iter058f ITER
T_edge = 1.00, n_e_edge/ne-bar = 0.75, <n_e20> = 1.1
100 MW NBI, 90-150 sec, Bt = 5.7T, Ip = 24MA
D + T w/ Carbon + Helium, Zeff = 1.5
&inpt
  btort(1) = 5.68,5.68,5.68,5.68,5.68,5.68,5.68,5.68,5.68
  csawth(1) = 0.9
  csawth(5) = 0
  csawth(9) = 1
  curmat(1) = 21,21,21,21,21,21,21,21,21
  elngbt(1) = 1.6,1.6,1.6,1.6,1.6,1.6,1.6,1.6,1.6
  lsawth(1) = 1
  lsawth(10) = 2
  lsawth(2) = 1
  lsawth(3) = 10
  lsawth(5) = 1
  lsawth(6) = 0
  lsawth(7) = 1
  lsweq(1) = 3
  lsweq(10) = 0
  lsweq(11) = 1
  lsweq(4) = 0
  lsweq(5) = 1
  lsweq(6) = 3
  lsweq(7) = 1
  lsweq(8) = 0
  mflxs = 25
  mom = 3
  mombnd = 2
  neqdt(1) = 10,10,10,10,10,25,25,30,30
  ntbkmx = 9
  qmin = 1.01
  rmajbt(1) = 8.14,8.14,8.14,8.14,8.14,8.14,8.14,8.14,8.14
  rminbt(1) = 2.8,2.8,2.8,2.8,2.8,2.8,2.8,2.8,2.8
  rtort(1) = 8.14,8.14,8.14,8.14,8.14,8.14,8.14,8.14,8.14
  shift = 0.05
  swtoff = 230
  swton = 10.07
  tbk(1) = 10,20,30,40,50,75,100,300,999
  trngbt(1) = 0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24,0.24
/
&ncodat
  nwbrem = 0
  nwchex = 0
  nwcool = 1100
  nwioni = 0
  nwline = 1000
  nwreko = 0
  recflx = 0
  recscr = 0
/
&nurun1
  cfutz(1) = 0
  cfutz(10) = 0
  cfutz(11) = 1
  cfutz(110) = 1
  cfutz(111) = 1
  cfutz(112) = 1
  cfutz(113) = 1
  cfutz(12) = 1
  cfutz(19) = 1
  cfutz(2) = 0
  cfutz(200) = 1
  cfutz(201) = 0.04
  cfutz(202) = 0.04
  cfutz(203) = 0.18
  cfutz(204) = 0.18
  cfutz(207) = 1
  cfutz(208) = 1
  cfutz(209) = 0.9
  cfutz(21) = 0
  cfutz(210) = 0.9
  cfutz(22) = 0
  cfutz(23) = 0
  cfutz(24) = 0
  cfutz(281) = 1.2
  cfutz(29) = 0
  cfutz(295) = 1
  cfutz(3) = 0
  cfutz(30) = 2
  cfutz(35) = 0.0002
  cfutz(36) = -6
  cfutz(37) = 0
  cfutz(38) = 0
  cfutz(39) = 3
  cfutz(4) = 0
  cfutz(410) = 1
  cfutz(42) = 0
  cfutz(43) = 500000
  cfutz(44) = 500000
  cfutz(480) = 1
  cfutz(481) = 1
  cfutz(5) = 0
  cfutz(57) = 0
  cfutz(58) = 0
  cfutz(6) = 0
  cfutz(7) = 0
  cfutz(70) = 1
  cfutz(71) = 0.95
  cfutz(74) = 0.12
  cfutz(76) = 0.04
  cfutz(8) = 0
  cfutz(81) = 4
  cfutz(9) = 1
  cimprd(10) = 0.1
  cthery(1) = 0
  cthery(111) = 0
  cthery(112) = 0
  cthery(113) = 0
  cthery(114) = 0
  cthery(12) = -4
  cthery(121) = 1
  cthery(123) = 1
  cthery(124) = 0
  cthery(13) = -4
  cthery(14) = -4
  cthery(15) = -4
  cthery(17) = 0
  cthery(2) = 1.013
  cthery(50) = 10
  cthery(51) = 10
  cthery(52) = 10
  cthery(53) = 10
  cthery(54) = 10
  cthery(6) = 0
  cthery(7) = 1
  cthery(78) = 1
  cthery(79) = 1
  cthery(8) = 3.5
  cthery(81) = -4
  cthery(82) = 0
  cthery(83) = -4
  cthery(85) = 2
  cthery(86) = 0.15
  delmax = 0.25
  errmax = 0.25
  extf = 1
  extzef = 1
  fdr = 0,0,0
  fdrint = 0
  fec = 0,0,0
  fig = 0.8,0.8,0.8
  fkb = 1,0.65,0.65
  fmh = 0,0,0
  frb = 1,1,1
  grecyc = 0
  leqtyp = 11
  limprd(32) = 2
  lnumer(31) = 4
  lsmord = 0
  lthery(13) = 3
  lthery(14) = 1
  lthery(15) = 0
  lthery(16) = 0
  lthery(17) = 1
  lthery(21) = 1
  lthery(25) = 0
  lthery(26) = 400
  lthery(27) = 1
  lthery(29) = 5
  lthery(3) = 4
  lthery(30) = 1
  lthery(31) = 1
  lthery(32) = -2
  lthery(4) = 1
  lthery(5) = 2
  lthery(6) = 1
  lthery(7) = 27
  lthery(8) = 21
  lthery(9) = 2
  ltrnsp(20) = 82
  ltrnsp(21) = 50
  natomc = 2
  nbound = 1
  ngpart = 200
  ngprof = 20
  nlextr = .false.
  nlomt2(13) = .true.
  nlomt2(21) = .true.
  nlomt2(26) = .true.
  nlpomt(1) = .false.
  nlpomt(10) = .false.
  nlpomt(11) = .false.
  nlpomt(12) = .false.
  nlpomt(13) = .false.
  nlpomt(14) = .false.
  nlpomt(15) = .false.
  nlpomt(16) = .false.
  nlpomt(17) = .false.
  nlpomt(18) = .false.
  nlpomt(19) = .false.
  nlpomt(2) = .false.
  nlpomt(20) = .true.
  nlpomt(21) = .true.
  nlpomt(22) = .false.
  nlpomt(23) = .true.
  nlpomt(24) = .true.
  nlpomt(25) = .true.
  nlpomt(3) = .false.
  nlpomt(4) = .false.
  nlpomt(5) = .false.
  nlpomt(6) = .true.
  nlpomt(7) = .true.
  nlpomt(8) = .true.
  nlpomt(9) = .true.
  nplot = 100000
  nrlmod = 1
  nrun = 90
  nsedit = 5
  ntrans = 2
  reread = 70.5
  rleprf = 0.965,0.86,0.764,0.677,0.598,0.526,0.462,0.404,0.352,0.305,0.264,0.228,0.196,0.168,0.144
     ,0.123,0.105,0.0899,0.0769,0.062,0.057,0.0494,0.0432,0.0381,0.0339,0.0305,0.0276
     ,0.0251,0.0209,0.0189,0.017,0.015,0.0129,0.0107,0.0083,0.0057,0.0031,0,0,0,0,0,0,0,0
     ,0,0,0,0,0,0,0,0
  rlepwr = 50000000
  rliprf = 0.965,0.86,0.764,0.677,0.598,0.526,0.462,0.404,0.352,0.305,0.264,0.228,0.196,0.168,0.144
     ,0.123,0.105,0.0899,0.0769,0.062,0.057,0.0494,0.0432,0.0381,0.0339,0.0305,0.0276
     ,0.0251,0.0209,0.0189,0.017,0.015,0.0129,0.0107,0.0083,0.0057,0.0031,0,0,0,0,0,0,0,0
     ,0,0,0,0,0,0,0,0
  rlipwr = 1
  theta = 4
  thetap = 0
  xfutz(2) = 1.732
  xfutz(6) = 0.5
/
&nurun2
  bdhyde(1,1) = 2148100000000,2148100000000,10224000000000,15375000000000,18450000000000,21525000000000
     ,24600000000000,27675000000000,30750000000000,33825000000000,33825000000000
     ,33825000000000,33825000000000,33825000000000,33825000000000
  bdhyde(1,2) = 2148100000000,2148100000000,10224000000000,15375000000000,18450000000000,21525000000000
     ,24600000000000,27675000000000,30750000000000,33825000000000,33825000000000
     ,33825000000000,33825000000000,33825000000000,33825000000000
  bdimpe(1,1) = 77760000000,77760000000,352000000000,500000000000,600000000000,700000000000,800000000000
     ,900000000000,1000000000000,1100000000000,1100000000000,1100000000000,1100000000000
     ,1100000000000,1100000000000
  bdimpe(1,2) = 48600000000,48600000000,720000000000,1875000000000,2250000000000,2625000000000
     ,3000000000000,3375000000000,3750000000000,4125000000000,4125000000000,4125000000000
     ,4125000000000,4125000000000,4125000000000
  bdtee = 3,3,4.206,4.7,5,5,5,5,5,5,5,5,5,5,5
  bdtie = 3,3,4.206,4.7,5,5,5,5,5,5,5,5,5,5,5
  bdtime = 0,90,94,98,102,106,110,114,118,122,126,150,250,500,900
  bz = 56800
  cjbeam = 1
  cpvelc = 0
  cpvion = 0
  curent = 21000
  denga0 = 20354000000000,20354000000000
  denga1 = 2148100000000,2148100000000
  denim0 = 736800000000,460500000000
  denim1 = 77760000000,48600000000
  denmon = 1,27000000000000,27000000000000,40000000000000,50000000000000,60000000000000
     ,70000000000000,80000000000000,90000000000000,100000000000000,110000000000000
     ,110000000000000,110000000000000,110000000000000,110000000000000,110000000000000
  dtinit = 0.0001
  dtmax = 0.5
  eehfit = 2,2
  eeifit = 2,2,2
  ehfit = 1,1
  eifit = 1,1,1
  eioniz = 0.03
  etefit = 1
  etifit = 1
  flgas = 0,0
  flimp(1,:) = 100000000000,100000000000,100000000000,100000000000,100000000000,100000000000,100000000000
     ,100000000000,100000000000,100000000000,100000000000,100000000000,100000000000
     ,100000000000,100000000000,100000000000,100000000000,100000000000,100000000000
     ,100000000000
  ftzeff = 1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5,1.5
  gflmax = 7e19,7e19,7e19,7e19,7e19,7e19,7e19,7e19,7e19,7e19,7e19,7e19,7e19,7e19,7e19,7e19,7e19,7e19
     ,7e19,7e19
  gfract = 0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5
  gftime = 0,90,94,98,102,106,110,114,118,122,126,150,250,500,900
  hangle(3,:) = 28.5,28.5,28.5,28.5,28.5,28.5
  haper(1) = 50,50,50,50,50,50
  haperv(1) = 150,150,150,150,150,150
  hdiv(1) = 0,0,0,0,0,0
  hdivv(1) = 0,0,0,0,0,0
  hebeam(1) = 1000,1000,1000,1000,1000,1000
  height(1) = 150,150,150,150,150,150
  hfocl(1) = 1000,1000,1000,1000,1000,1000
  hfoclv(1) = 1400,1400,1400,1400,1400,1400
  hfract(1,1) = 0.998,0.001,0.001,0.998,0.001,0.001,0.998,0.001,0.001,0.998,0.001,0.001,0.998,0.001,0.001
     ,0.998,0.001,0.001
  hfutz(1) = 0.25
  hlenth(1) = 900,900,900,900,900,900
  hnchek = 0.1
  hpowmw(1) = 16.5,16.5,0,0,0,0
  hrmaj(1) = 800,800,800,800,800,800
  hrmin(1) = 500,500,500,500,500,500
  htchek = 0.3
  htoff(1) = 999,999,999,999,999,999
  hton(1) = 90,90,90,90,90,90
  hwidth(1) = 50,50,50,50,50,50
  nedit = 0
  ngas = -2,-3
  nhaper(1) = 2,2,2,2,2,2
  nhbeam(1) = -2,-2,-2,-2,-2,-2
  nhshap(1) = 2,2,2,2,2,2
  nimp = 6,2
  nipart = 20000
  niprof = 20
  npel2 = 1
  npelga(1) = -2,-2,-2,-2,-2,-2,-2,-2,-2,-2
  npuff = 2
  nrfit = 2
  nskip = 1
  ntty = 1
  ntype = 1
  nzones = 50
  rastar = 1
  rcwals = 814
  rdwals = 420
  rmajor = 814
  rminor = 280
  rpa(1) = 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
  rpela(1) = 0.08,0.08,0.08,0.08,0.08,0.08
  sedit = 5
  splot = 1
  tcold = 1
  tcoldp = 1
  te0 = 3
  te1 = 3
  ti0 = 3
  ti1 = 3
  timp = 0,90,94,98,102,106,110,114,118,122,126,130,140,150,160,170,180,200,500,999
  tinit = 70
  tmax = 120
  tpela(1) = 999,999,999,999,999,999
  vpela(1) = 50000,50000,70000,100000,130000,150000
  ypa(1) = 0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5,0.5
/
&nmread
  cimprd(10) = 1
  reread = 90.2
/
&nmread
  cimprd(10) = 1
  dtmax = 0.5
  reread = 245
/
&nmread
  dtmax = 0.2
  reread = 999
/
&nmread
  dtmax = 0.5
/


`)

if(route.query.caseId){
  $$fetch('/api/Case/GetCase',{
    method:'GET',
    params:{
      id:route.query.caseId
    }
  }).then((item)=>{
    namelist.value = item.caseNamelist
  })
}

const submit = () =>{
  $$fetch("/api/Case/CreateCaseByNamelist",{
    method:"PUT",
    body:{
      namelist: namelist.value,
      supercomputer: selectedSupercomputer.value, // 添加超算选择
    }
  }).then((data)=>{
    if(data.success){
      alert('提交成功！')
      setTimeout(()=>{
        navigateTo('/cases')
      },1000)
    }else{
      alert('提交失败！')
    }
  })
}
</script>

<style>

</style>