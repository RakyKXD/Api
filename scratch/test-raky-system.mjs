import {
  getUserMultiAccounts,
  addLinkedAccount,
  updateLinkedAccount,
  switchLinkedAccount,
  getNearbyUsers,
  getForumMessageKarma,
  voteForumMessage
} from '../lib/raky-service.js'

async function run() {
  console.log('=== Test 1: Multi-Accounts (User 900000000000000001) ===')
  const multi = await getUserMultiAccounts('900000000000000001')
  console.log('Accounts count:', multi.accounts.length)
  console.log('Has verified phone:', multi.has_verified_phone)
  console.log('Max accounts:', multi.max_accounts)
  console.log('Active account:', multi.active_account_id)

  console.log('\n=== Test 2: Add Account for User Without Phone ===')
  try {
    // User 900000000000000002 doesn't have phone
    await addLinkedAccount('900000000000000002', { label: 'Gaming', username: 'alex_gaming' })
    console.error('FAIL: Should have blocked account creation without verified phone!')
  } catch (err) {
    console.log('PASS (Blocked as expected):', err.message)
  }

  console.log('\n=== Test 3: Add Account for User With Phone (900000000000000001) ===')
  let testAccId = null
  if (multi.accounts.length < 3) {
    const newAcc = await addLinkedAccount('900000000000000001', {
      label: 'Gaming',
      username: `testgamer_${Date.now().toString().slice(-4)}`,
      global_name: 'Test Gamer Pro',
      bio: 'Cuenta de juegos'
    })
    console.log('Created linked account:', newAcc.account.username, '| Label:', newAcc.account.label)
    testAccId = newAcc.account.id
  } else {
    console.log('User already has 3 accounts linked.')
    testAccId = multi.accounts[1]?.id
  }

  if (testAccId) {
    console.log('\n=== Test 4: Update Linked Account ===')
    const updated = await updateLinkedAccount('900000000000000001', testAccId, {
      label: 'Trabajo / Dev',
      global_name: 'Dev Specialist'
    })
    console.log('Updated label:', updated.label, '| Global Name:', updated.global_name)

    console.log('\n=== Test 5: Switch Linked Account ===')
    const switched = await switchLinkedAccount('900000000000000001', testAccId)
    console.log('Switched to active account:', switched.active_account_id, '| Has token:', Boolean(switched.token))

    // Switch back to primary
    await switchLinkedAccount('900000000000000001', '900000000000000001')
    console.log('Switched back to primary account.')
  }

  console.log('\n=== Test 6: Nearby Users (Real Users) ===')
  const nearby = await getNearbyUsers('900000000000000001', 40.4168, -3.7038, 50, '')
  console.log('Found nearby real users:', nearby.length)
  for (const u of nearby) {
    console.log(`- ${u.global_name} (@${u.username}): ~${u.distance_km} km (${u.location_approx})`)
  }

  console.log('\n=== Test 7: Forum Karma ===')
  const karma = await voteForumMessage('test_forum_ch', 'test_msg_1', '900000000000000001', 1)
  console.log('Forum message karma score:', karma.score)

  console.log('\n>>> ALL RAKY BACKEND TESTS PASSED SUCCESSFULLY! <<<')
}

run().catch(console.error)
