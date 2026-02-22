const { predictPlacementNative, loadAssets } = require('./utils/predictPlacement');

async function test() {
    await loadAssets();

    console.log('\n--- Scenario 1: Average Student Profile ---');
    const avgProfile = {
        DSA_Skill: 6.0,
        GP: 10.0,
        Internships: 1,
        Active_Backlogs: 0,
        Tenth_Marks: 80.0,
        Twelfth_Marks: 80.0
    };
    let res1 = await predictPlacementNative(avgProfile);
    console.log(res1);

    console.log('\n--- Scenario 2: Exceptional Student Profile ---');
    const excProfile = {
        DSA_Skill: 10.0,
        GP: 10.0,
        Internships: 3,
        Active_Backlogs: 0,
        Tenth_Marks: 95.0,
        Twelfth_Marks: 95.0
    };
    let res2 = await predictPlacementNative(excProfile);
    console.log(res2);

    console.log('\n--- Scenario 3: Poor Student Profile ---');
    const poorProfile = {
        DSA_Skill: 3.0,
        GP: 10.0,
        Internships: 0,
        Active_Backlogs: 2,
        Tenth_Marks: 60.0,
        Twelfth_Marks: 60.0
    };
    let res3 = await predictPlacementNative(poorProfile);
    console.log(res3);
}

test();
