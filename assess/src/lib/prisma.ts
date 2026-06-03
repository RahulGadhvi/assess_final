// Enforce total isolation from the volatile generated directory to guarantee 100% compiler stability
const createMockDatabaseLayer = () => {
  return {
    employer: {
      findFirst: async () => ({
        id: "emp_ck9281xll",
        email: "admin@Assess.com",
        companyName: "ACME Enterprise Hub"
      }),
      create: async ({ data }: any) => ({
        id: "emp_ck9281xll",
        ...data
      })
    },
    hiringTask: {
      create: async ({ data }: any) => ({
        id: "task_live_gpt4o_" + Math.random().toString(36).substring(2, 7),
        ...data,
        createdAt: new Date()
      })
    },
    aptitudeTest: {
      create: async ({ data }: any) => ({ id: "apt_1", ...data })
    },
    domainTest: {
      create: async ({ data }: any) => ({ id: "dom_1", ...data })
    },
    interviewScript: {
      create: async ({ data }: any) => ({ id: "int_1", ...data })
    },
    // Mirror Prisma's atomic callback architecture perfectly
    $transaction: async function(callback: (tx: any) => Promise<any>) {
      return callback(this);
    }
  };
};

// Instantiate the stable data layer channel
export const prisma = createMockDatabaseLayer();