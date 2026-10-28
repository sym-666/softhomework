import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface InputData {
  block1: {
    namelist: string;
    nrun: number;
    leqtyp: number;
    reread: number;
    'limprd(32)': number;
    lsmord: number;
    'lnumer(31)': number;
    theta: number;
    thetap: number;
    nsedit: number;
    nplot: number;
    errmax: number;
    delmax: number;
    ntrans: number;
    nbound: number;
    nlextr: boolean;
    'nlomt2(13)': boolean;
    'nlomt2(21)': boolean;
    'nlomt2(26)': boolean;
  };
  block2: {
    namelist: string;
    cfutz: {
      index: number[];
      values: number[];
    };
  };
  block3: {
    namelist: string;
    natomc: number;
    extzef: number;
    extf: number;
    grecyc: number;
    ngprof: number;
    ngpart: number;
    cimprd: {
      index: number[];
      values: number[];
    };
    xfutz: {
      index: number[];
      values: number[];
    };
  };
  block4: {
    namelist: string;
    fdrint: number;
    lthery: {
      index: number[];
      values: number[];
    };
    cthery: {
      index: number[];
      values: number[];
    };
    ltrnsp: {
      index: number[];
      values: number[];
    };
    fdr: number[];
    fig: number[];
    fec: number[];
    fkb: number[];
    frb: number[];
    fmh: number[];
  };
  block5: {
    namelist: string;
    nlpomt: {
      index: number[];
      values: number[];
    };
    nrlmod: number;
    rlipwr: number;
    rlepwr: number;
    rliprf: number[];
    rleprf: number[];
  };
  block6: {
    namelist: string;
    rastar: number;
    nedit: number;
    nskip: number;
    splot: number;
    sedit: number;
    ntty: number;
    tinit: number;
    tmax: number;
    dtinit: number;
    dtmax: number;
    nzones: number;
    ntype: number;
    rcwals: number;
    rdwals: number;
    eioniz: number;
    nrfit: number;
    cpvelc: number;
    cpvion: number;
  };
  [key: string]: any;
}

const initialState: InputData = {
  block1: {
    namelist: 'nurun1',
    nrun: 90,
    leqtyp: 11,
    reread: 70.5,
    'limprd(32)': 2,
    lsmord: 0,
    'lnumer(31)': 4,
    theta: 4,
    thetap: 0,
    nsedit: 5,
    nplot: 100000,
    errmax: 0.25,
    delmax: 0.25,
    ntrans: 2,
    nbound: 1,
    nlextr: false,
    'nlomt2(13)': true,
    'nlomt2(21)': true,
    'nlomt2(26)': true,
  },
  block2: {
    namelist: 'nurun1',
    cfutz: {
      index: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 19, 21, 22, 23, 24, 29, 30, 35,
        36, 37, 38, 39, 42, 43, 44, 57, 58, 70, 71, 74, 76, 81, 110, 111, 112,
        113, 200, 201, 202, 203, 204, 207, 208, 209, 210, 281, 295, 410, 480,
        481,
      ],
      values: [
        0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 2, 0.0002, -6, 0,
        0, 3, 0, 500000, 500000, 0, 0, 1, 0.95, 0.12, 0.04, 4, 1, 1, 1, 1, 1,
        0.04, 0.04, 0.18, 0.18, 1, 1, 0.9, 0.9, 1.2, 1, 1, 1, 1,
      ],
    },
  },
  block3: {
    namelist: 'nurun1',
    natomc: 2,
    extzef: 1,
    extf: 1,
    grecyc: 0,
    ngprof: 20,
    ngpart: 200,
    cimprd: {
      index: [10],
      values: [0.1],
    },
    xfutz: {
      index: [2, 6],
      values: [1.732, 0.5],
    },
  },
  block4: {
    namelist: 'nurun1',
    fdrint: 0,
    lthery: {
      index: [
        3, 4, 5, 6, 7, 8, 9, 13, 14, 15, 16, 17, 21, 25, 26, 27, 29, 30, 31, 32,
      ],
      values: [4, 1, 2, 1, 27, 21, 2, 3, 1, 0, 0, 1, 1, 0, 400, 1, 5, 1, 1, -2],
    },
    cthery: {
      index: [
        1, 2, 6, 7, 8, 12, 13, 14, 15, 17, 50, 51, 52, 53, 54, 78, 79, 81, 82,
        83, 85, 86, 111, 112, 113, 114, 121, 123, 124,
      ],
      values: [
        0, 1.013, 0, 1, 3.5, -4, -4, -4, -4, 0, 10, 10, 10, 10, 10, 1, 1, -4, 0,
        -4, 2, 0.15, 0, 0, 0, 0, 1, 1, 0,
      ],
    },
    ltrnsp: {
      index: [20, 21],
      values: [82, 50],
    },
    fdr: [0, 0, 0],
    fig: [0.8, 0.8, 0.8],
    fec: [0, 0, 0],
    fkb: [1, 0.65, 0.65],
    frb: [1, 1, 1],
    fmh: [0, 0, 0],
  },
  block5: {
    namelist: 'nurun1',
    nlpomt: {
      index: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25,
      ],
      values: [
        0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1,
        1,
      ],
    },
    nrlmod: 1,
    rlipwr: 1,
    rlepwr: 50e6,
    rliprf: [
      0.965, 0.86, 0.764, 0.677, 0.598, 0.526, 0.462, 0.404, 0.352, 0.305,
      0.264, 0.228, 0.196, 0.168, 0.144, 0.123, 0.105, 0.0899, 0.0769, 0.062,
      0.057, 0.0494, 0.0432, 0.0381, 0.0339, 0.0305, 0.0276, 0.0251, 0.0209,
      0.0189, 0.017, 0.015, 0.0129, 0.0107, 0.0083, 0.0057, 0.0031, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    ],
    rleprf: [
      0.965, 0.86, 0.764, 0.677, 0.598, 0.526, 0.462, 0.404, 0.352, 0.305,
      0.264, 0.228, 0.196, 0.168, 0.144, 0.123, 0.105, 0.0899, 0.0769, 0.062,
      0.057, 0.0494, 0.0432, 0.0381, 0.0339, 0.0305, 0.0276, 0.0251, 0.0209,
      0.0189, 0.017, 0.015, 0.0129, 0.0107, 0.0083, 0.0057, 0.0031, 0.0, 0.0,
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    ],
  },
  block6: {
    namelist: 'nurun2',
    rastar: 1,
    nedit: 0,
    nskip: 1,
    splot: 1,
    sedit: 5,
    ntty: 1,
    tinit: 70,
    tmax: 120,
    dtinit: 0.0001,
    dtmax: 0.5,
    nzones: 50,
    ntype: 1,
    rcwals: 814,
    rdwals: 420,
    eioniz: 0.03,
    nrfit: 2,
    cpvelc: 0,
    cpvion: 0,
  },
  block7: {
    namelist: 'nurun2',
    rmajor: 814,
    rminor: 280,
    curent: 21000,
    bz: 56800,
    ti0: 3,
    te0: 3,
    ti1: 3,
    te1: 3,
    etifit: 1,
    etefit: 1,
    ngas: [-2, -3],
    denga0: [2.0354e13, 2.0354e13],
    denga1: [2.1481e12, 2.1481e12],
    nimp: [6, 2],
    denim0: [7.368e11, 4.605e11],
    denim1: [7.776e10, 4.86e10],
    ehfit: [1, 1],
    eifit: [1, 1, 1],
    eehfit: [2, 2],
    eeifit: [2, 2, 2],
  },
  block8: {
    namelist: 'nurun2',
    tcoldp: 1,
    tcold: 1,
    bdtime: [
      0.0, 90.0, 94.0, 98.0, 102.0, 106.0, 110.0, 114.0, 118.0, 122.0, 126.0,
      150.0, 250.0, 500.0, 900.0,
    ],
    'bdhyde(1,1)': [
      2.1481e12, 2.1481e12, 1.0224e13, 1.5375e13, 1.845e13, 2.1525e13, 2.46e13,
      2.7675e13, 3.075e13, 3.3825e13, 3.3825e13, 3.3825e13, 3.3825e13,
      3.3825e13, 3.3825e13,
    ],
    'bdhyde(1,2)': [
      2.1481e12, 2.1481e12, 1.0224e13, 1.5375e13, 1.845e13, 2.1525e13, 2.46e13,
      2.7675e13, 3.075e13, 3.3825e13, 3.3825e13, 3.3825e13, 3.3825e13,
      3.3825e13, 3.3825e13,
    ],
    'bdimpe(1,1)': [
      7.776e10, 7.776e10, 3.52e11, 5.0e11, 6.0e11, 7.0e11, 8.0e11, 9.0e11,
      1.0e12, 1.1e12, 1.1e12, 1.1e12, 1.1e12, 1.1e12, 1.1e12,
    ],
    'bdimpe(1,2)': [
      4.86e10, 4.86e10, 7.2e11, 1.875e12, 2.25e12, 2.625e12, 3.0e12, 3.375e12,
      3.75e12, 4.125e12, 4.125e12, 4.125e12, 4.125e12, 4.125e12, 4.125e12,
    ],
    bdtee: [3, 3, 4.206, 4.7, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    bdtie: [3, 3, 4.206, 4.7, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
    flgas: [0, 0],
  },
  block9: {
    namelist: 'nurun2',
    npuff: 2,
    npel2: 1,
    gflmax: [
      7e19, 7e19, 7e19, 7e19, 7e19, 7e19, 7e19, 7e19, 7e19, 7e19, 7e19, 7e19,
      7e19, 7e19, 7e19, 7e19, 7e19, 7e19, 7e19, 7e19,
    ],
    gftime: [
      0.0, 90.0, 94.0, 98.0, 102.0, 106.0, 110.0, 114.0, 118.0, 122.0, 126.0,
      150.0, 250.0, 500.0, 900.0,
    ],
    denmon: [
      1, 2.7e13, 2.7e13, 4.0e13, 5.0e13, 6.0e13, 7.0e13, 8.0e13, 9.0e13,
      10.0e13, 11.0e13, 11.0e13, 11e13, 11e13, 11e13, 11e13,
    ],
    gfract: [
      0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
      0.5, 0.5, 0.5, 0.5, 0.5,
    ],
    timp: [
      0, 90, 94, 98, 102, 106, 110, 114, 118, 122, 126, 130, 140, 150, 160, 170,
      180, 200, 500, 999,
    ],
    'flimp(1,:)': [
      1e11, 1e11, 1e11, 1e11, 1e11, 1e11, 1e11, 1e11, 1e11, 1e11, 1e11, 1e11,
      1e11, 1e11, 1e11, 1e11, 1e11, 1e11, 1e11, 1e11,
    ],
    ftzeff: [
      1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5,
      1.5, 1.5, 1.5, 1.5, 1.5,
    ],
    'tpela(1)': [999.0, 999.0, 999.0, 999.0, 999.0, 999.0],
    'vpela(1)': [0.5e5, 0.5e5, 0.7e5, 1.0e5, 1.3e5, 1.5e5],
    'rpela(1)': [0.08, 0.08, 0.08, 0.08, 0.08, 0.08],
    'npelga(1)': [-2, -2, -2, -2, -2, -2, -2, -2, -2, -2],
    'rpa(1)': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'ypa(1)': [
      0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5,
      0.5, 0.5, 0.5, 0.5, 0.5,
    ],
  },
  block10: {
    namelist: 'nurun2',
    cjbeam: 1,
    hnchek: 0.1,
    htchek: 0.3,
    nipart: 20000,
    niprof: 20,
    'hton(1)': [90, 90, 90, 90, 90, 90],
    'htoff(1)': [999, 999, 999, 999, 999, 999],
    'hangle(3,:)': [28.5, 28.5, 28.5, 28.5, 28.5, 28.5],
    'hrmaj(1)': [800, 800, 800, 800, 800, 800],
    'hrmin(1)': [500, 500, 500, 500, 500, 500],
    'haper(1)': [50, 50, 50, 50, 50, 50],
    'haperv(1)': [150, 150, 150, 150, 150, 150],
    'hdiv(1)': [0, 0, 0, 0, 0, 0],
    'hdivv(1)': [0, 0, 0, 0, 0, 0],
    'hwidth(1)': [50, 50, 50, 50, 50, 50],
    'height(1)': [150, 150, 150, 150, 150, 150],
    'hfocl(1)': [1e3, 1e3, 1e3, 1e3, 1e3, 1e3],
    'hfoclv(1)': [1.4e3, 1.4e3, 1.4e3, 1.4e3, 1.4e3, 1.4e3],
    'hlenth(1)': [900, 900, 900, 900, 900, 900],
    'nhaper(1)': [2, 2, 2, 2, 2, 2],
    'nhshap(1)': [2, 2, 2, 2, 2, 2],
    'hebeam(1)': [1000, 1000, 1000, 1000, 1000, 1000],
    'hfract(1,1)': [
      0.998, 0.001, 0.001, 0.998, 0.001, 0.001, 0.998, 0.001, 0.001, 0.998,
      0.001, 0.001, 0.998, 0.001, 0.001, 0.998, 0.001, 0.001,
    ],
    'hpowmw(1)': [16.5, 16.5, 0, 0, 0, 0],
    'nhbeam(1)': [-2, -2, -2, -2, -2, -2],
    'hfutz(1)': [0.25],
  },
  block11: {
    namelist: 'ncodat',
    recflx: 0,
    recscr: 0,
    nwcool: 1100,
    nwline: 1000,
    nwioni: 0,
    nwreko: 0,
    nwchex: 0,
    nwbrem: 0,
  },
  block12: {
    namelist: 'inpt',
    qmin: 1.01,
    mombnd: 2,
    mom: 3,
    ntbkmx: 9,
    shift: 0.05,
    mflxs: 25,
    swton: 10.07,
    swtoff: 230,
    lsweq: {
      index: [1, 4, 5, 6, 7, 8, 10, 11],
      values: [3, 0, 1, 3, 1, 0, 0, 1],
    },
    'tbk(1)': [10.0, 20.0, 30.0, 40.0, 50.0, 75.0, 100.0, 300.0, 999],
    'neqdt(1)': [10, 10, 10, 10, 10, 25, 25, 30, 30],
    'rmajbt(1)': [8.14, 8.14, 8.14, 8.14, 8.14, 8.14, 8.14, 8.14, 8.14],
    'rminbt(1)': [2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8, 2.8],
    'elngbt(1)': [1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6],
    'trngbt(1)': [0.24, 0.24, 0.24, 0.24, 0.24, 0.24, 0.24, 0.24, 0.24],
    'btort(1)': [5.68, 5.68, 5.68, 5.68, 5.68, 5.68, 5.68, 5.68, 5.68],
    'rtort(1)': [8.14, 8.14, 8.14, 8.14, 8.14, 8.14, 8.14, 8.14, 8.14],
    'curmat(1)': [21, 21, 21, 21, 21, 21, 21, 21, 21],
    lsawth: {
      index: [1, 2, 3, 5, 6, 7, 10],
      values: [1, 1, 10, 1, 0, 1, 2],
    },
    csawth: {
      index: [1, 5, 9],
      values: [0.9, 0, 1],
    },
  },
  block13: {
    namelist: 'nmread1',
    reread: 90.2,
    cimprd: {
      index: [10],
      values: [1],
    },
  },
  block14: {
    namelist: 'nmread2',
    dtmax: 0.5,
    reread: 245,
    cimprd: {
      index: [10],
      values: [1],
    },
  },
  block15: {
    namelist: 'nmread3',
    dtmax: 0.2,
    reread: 999,
  },
  block16: {
    namelist: 'nmread4',
    dtmax: 0.5,
  },
};

interface UpdateFieldPayload {
  block: string;
  field: string;
  value: any;
}

interface UpdateArrayFieldPayload {
  block: string;
  field: string;
  index: number;
  value: number;
}

interface ArrayItemPayload {
  block: string;
  field: string;
  indexValue: number;
  dataValue: number;
}

interface RemoveArrayItemPayload {
  block: string;
  field: string;
  index: number;
}

const inputSlice = createSlice({
  name: 'input',
  initialState,
  reducers: {
    updateField: (state, action: PayloadAction<UpdateFieldPayload>) => {
      const { block, field, value } = action.payload;
      if (state[block]) {
        state[block][field] = value;
      }
    },
    updateArrayField: (
      state,
      action: PayloadAction<UpdateArrayFieldPayload>,
    ) => {
      const { block, field, index, value } = action.payload;
      if (state[block] && state[block][field] && state[block][field].values) {
        state[block][field].values[index] = value;
      }
    },
    addArrayItem: (state, action: PayloadAction<ArrayItemPayload>) => {
      const { block, field, indexValue, dataValue } = action.payload;
      if (state[block] && state[block][field]) {
        state[block][field].index.push(indexValue);
        state[block][field].values.push(dataValue);
      }
    },
    removeArrayItem: (state, action: PayloadAction<RemoveArrayItemPayload>) => {
      const { block, field, index } = action.payload;
      if (state[block] && state[block][field]) {
        state[block][field].index.splice(index, 1);
        state[block][field].values.splice(index, 1);
      }
    },
    resetInput: () => {
      return initialState;
    },
    setInputData: (_, action: PayloadAction<InputData>) => {
      return action.payload;
    },
  },
});

export const {
  updateField,
  updateArrayField,
  addArrayItem,
  removeArrayItem,
  resetInput,
  setInputData,
} = inputSlice.actions;

export default inputSlice.reducer;
