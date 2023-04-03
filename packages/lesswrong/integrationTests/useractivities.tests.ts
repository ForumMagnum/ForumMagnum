import "./integrationTestSetup";
import UserActivities from "../lib/collections/useractivities/collection";
import { updateUserActivities } from "../server/useractivities/cron";
import { getUserActivityData } from "../server/useractivities/getUserActivityData";

jest.mock("../server/useractivities/getUserActivityData");

const existingStartDate = new Date('2023-03-20T00:00:00.000Z');
const existingEndDate = new Date('2023-03-21T00:00:00.000Z');

const newEndDate = new Date('2023-03-21T12:00:00.000Z');

const insertTestData = async () => {
  await UserActivities.rawInsert({
    visitorId: 'userId1',
    type: 'userId',
    startDate: existingStartDate,
    endDate: existingEndDate,
    activityArray: Array(24).fill(1),
  });
  await UserActivities.rawInsert({
    visitorId: 'userId2',
    type: 'userId',
    startDate: existingStartDate,
    endDate: existingEndDate,
    activityArray: Array(24).fill(1),
  });
  await UserActivities.rawInsert({
    visitorId: 'clientId1',
    type: 'clientId',
    startDate: existingStartDate,
    endDate: existingEndDate,
    activityArray: Array(24).fill(0),
  });
};


describe('updateUserActivities', () => {
  it('should handle all activity cases correctly', async () => {
    /*
    * Cases we want to test:
    * - The four cases in concatNewActivity:
    *   - First case: Add rows for users who are newly active (zero padding the end as necessary)
    *   - Second case: Append the new activity to users' rows who were previously active.
    *   - Third case: Zero-pad the start of rows for users who were previously active but have no new activity
    *   - Fourth case: Every user has had their activity updated now. Remove rows for users who are no longer active in the last
    */
    await insertTestData();
  
    const newUserId = 'userIdNew';
    const newClientId = 'clientIdNew';
    const existingUserId1 = 'userId1';
    const existingUserId2 = 'userId2';
    const existingClientId1 = 'clientId1';
  
    // Define the mocked response from getUserActivityFactors
    const mockedActivityFactors = [
      {
        userOrClientId: `u:${newUserId}`,
        activityArray: [1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1], // 12 hours
      },
      {
        userOrClientId: `c:${newClientId}`,
        activityArray: [1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1], // 12 hours
      },
      {
        userOrClientId: `u:${existingUserId1}`,
        activityArray: [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 12 hours
      },
      // `u:${existingUserId2}`, no new activity
    ];
  
    // Set up the mock implementation to return the mocked response
    (getUserActivityData as jest.MockedFunction<typeof getUserActivityData>).mockResolvedValue(mockedActivityFactors);
  
    // Run updateUserActivities
    await updateUserActivities({ updateEndDate: newEndDate });
  
    const allUserActivities = await UserActivities.find({}).fetch();
    expect(allUserActivities.length).toEqual(4); // 3 existing users, 2 new users, 1 user removed (userId2)
  
    // Test for first case: Add rows for users who are newly active (zero padding the end as necessary)
    const newUserActivity = await UserActivities.findOne({ visitorId: newUserId });
    const newClientActivity = await UserActivities.findOne({ visitorId: newClientId });
  
    expect(newUserActivity).toBeTruthy(); // New user exists in db
    expect(newUserActivity?.startDate).toEqual(existingStartDate); // Start date goes all the way back to the start of the existing data
    expect(newUserActivity?.endDate).toEqual(newEndDate); // End date is the new end date
    expect(newUserActivity?.activityArray).toEqual([1,1,0,0,0,1,0,0,0,0,1,1].concat(Array(24).fill(0))); // Activity array is the new activity, plus zero padding
    
    expect(newClientActivity).toBeTruthy(); // New user exists in db
    expect(newClientActivity?.startDate).toEqual(existingStartDate); // Start date goes all the way back to the start of the existing data
    expect(newClientActivity?.endDate).toEqual(newEndDate); // End date is the new end date
    expect(newClientActivity?.activityArray).toEqual([1,1,0,0,0,1,0,0,0,0,1,1].concat(Array(24).fill(0))); // Activity array is the new activity, plus zero padding
  
    // Test for second case: Append the new activity to users' rows who were previously active.
    const existingUser1Activity = await UserActivities.findOne({ visitorId: existingUserId1 });
    expect(existingUser1Activity?.activityArray).toEqual([1,0,1,1,1,1,1,1,1,1,1,1].concat(Array(24).fill(1))); // Activity array is the new activity, plus the old activity on the end
  
    // Test for third case: Zero-pad the start of rows for users who were previously active but have no new activity
    const existingUser2Activity = await UserActivities.findOne({ visitorId: existingUserId2 });
    expect(existingUser2Activity?.activityArray).toEqual(Array(12).fill(0).concat(Array(24).fill(1)));
  
    // Test for fourth case: Every user has had their activity updated now. Remove rows for users who are no longer active in the last
    const existingClient1Activity = await UserActivities.findOne({ visitorId: existingClientId1 });
    expect(existingClient1Activity).toEqual(undefined);
  });
  
});
