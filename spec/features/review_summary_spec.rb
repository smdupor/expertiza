describe "peer review testing" do

  # User first and second are on AssignmentTeam first
  # User third is on AssignmentTeam second
  # User third is mapped to review team one
  # User second is mapped to review team two
  before(:each) do
    create(:assignment, name: "TestAssignment", directory_path: 'test_assignment')
    create_list(:participant, 3)
    create(:assignment_node)
    create(:deadline_type, name: "submission")
    create(:deadline_type, name: "review")
    create(:deadline_type, name: "metareview")
    create(:deadline_type, name: "drop_topic")
    create(:deadline_type, name: "signup")
    create(:deadline_type, name: "team_formation")
    create(:deadline_right)
    create(:deadline_right, name: 'Late')
    create(:deadline_right, name: 'OK')
    create(:assignment_due_date, deadline_type: DeadlineType.where(name: 'review').first, due_at: Time.now.in_time_zone + 1.day)
    create(:topic)
    create(:topic, topic_name: "TestReview")
    create(:team_user, user: User.where(role_id: 1).first)
    create(:team_user, user: User.where(role_id: 1).second)
    create(:assignment_team)
    create(:team_user, user: User.where(role_id: 1).third, team: AssignmentTeam.second)
    create(:signed_up_team)
    create(:signed_up_team, team_id: 2, topic: SignUpTopic.second)
    create(:assignment_questionnaire)
    create(:question)
    create(:submission_record)
    create(:submission_record, team_id: 2)
    create(:review_response_map, reviewer_id: User.where(role_id: 1).third.id)
    create(:review_response_map, reviewer_id: User.where(role_id: 1).first.id, reviewee: AssignmentTeam.second)
    create(:review_response_map, reviewer_id: User.where(role_id: 1).second.id, reviewee: AssignmentTeam.second)

    create(:review_grade, review_graded_at: Time.now.in_time_zone)
  end


  # User 3 navigates to the Your scores page
  def load_your_scores
    login_as(User.where(role_id:1).third.name)
    expect(page).to have_content "User: " + User.where(role_id:1).third.name

    click_link "Assignments"
    expect(page).to have_content "TestAssignment"

    click_link "TestAssignment"
    expect(page).to have_content "Submit or Review work for TestAssignment"
    expect(page).to have_content "Your scores"
    expect(page).to have_content "Alternate View"

    click_link "Your scores"
    expect(page).to have_content 'Summary Report for assignment: TestAssignment'
  end

  # User 1 adds a review to Team 2
  def add_review
    login_as(User.where(role_id:1).first.name)
    expect(page).to have_content "User: " + User.where(role_id:1).first.name

    expect(page).to have_content "TestAssignment"

    click_link "TestAssignment"
    expect(page).to have_content "Submit or Review work for TestAssignment"
    expect(page).to have_content "Others' work"

    click_link "Others' work"
    expect(page).to have_content 'Reviews for "TestAssignment"'

    choose "topic_id"
    click_button "Request a new submission to review"

    click_link "Begin"

    fill_in "responses[0][comment]", with: "HelloWorld"
    select 3, from: "responses[0][score]"
    click_button "Submit Review"
    expect(page).to have_content "Your response was successfully saved."
    click_link "Logout"
  end


  it "view summary report" do
    # Load Summary Report with no reviews
    load_your_scores
    # print page.body
    expect(page).to have_content "Average peer review score: "

    # Add review as first user
    click_link "Logout"
    add_review

    # View Summary Report with one review
    load_your_scores
    print page.body
    # Prob 60 is the score is 3/5, but using have_no_content to figure out
    # how to add a review and have it show up in "Your scores"
    expect(page).to have_content "Average peer review score: "
    expect(page).to have_no_content "Average peer review score: \n"

  end
end