chucamo a SAT platform preparation
```
ok chim
├─ client
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.js
│  ├─ public
│  │  ├─ apple.png
│  │  ├─ googlebaaf953da8a04e43.html
│  │  ├─ index.html
│  │  └─ manifest.json
│  ├─ src
│  │  ├─ App.js
│  │  ├─ components
│  │  │  ├─ Layout
│  │  │  │  └─ Layout.js
│  │  │  ├─ UI
│  │  │  │  ├─ Button.js
│  │  │  │  ├─ CalculatorPopup.js
│  │  │  │  ├─ ErrorBoundary.js
│  │  │  │  ├─ HighlightingTest.js
│  │  │  │  ├─ Input.js
│  │  │  │  ├─ KaTeXDisplay.js
│  │  │  │  ├─ KaTeXEditor.js
│  │  │  │  ├─ LessonCreator.js
│  │  │  │  ├─ LessonViewer.js
│  │  │  │  ├─ LoadingSpinner.js
│  │  │  │  ├─ MultipleAnswersEditor.js
│  │  │  │  ├─ ReadingPassageEditor.js
│  │  │  │  ├─ RichTextDisplay.js
│  │  │  │  ├─ RichTextDocument.js
│  │  │  │  ├─ RichTextEditor.js
│  │  │  │  ├─ SimpleRichText.js
│  │  │  │  ├─ SimpleRichTextEditor.js
│  │  │  │  ├─ Watermark.js
│  │  │  │  └─ WrittenAnswerInput.js
│  │  │  └─ VocabularyStudy.js
│  │  ├─ contexts
│  │  │  └─ AuthContext.js
│  │  ├─ hooks
│  │  │  └─ useCopyWatermark.js
│  │  ├─ index.css
│  │  ├─ index.js
│  │  ├─ pages
│  │  │  ├─ Admin
│  │  │  │  ├─ Admin.js
│  │  │  │  ├─ DailyVocabManagement.js
│  │  │  │  ├─ RecordingManagement.js
│  │  │  │  ├─ StudyPlanManagement.js
│  │  │  │  └─ VocabQuizManagement.js
│  │  │  ├─ Articles
│  │  │  │  ├─ ArticleReader.js
│  │  │  │  ├─ Articles.js
│  │  │  │  └─ ArticlesManagement.js
│  │  │  ├─ Auth
│  │  │  │  ├─ Login.js
│  │  │  │  └─ Register.js
│  │  │  ├─ DailyVocab
│  │  │  │  └─ DailyVocab.js
│  │  │  ├─ Dashboard
│  │  │  │  └─ Dashboard.js
│  │  │  ├─ PetHouse
│  │  │  │  └─ PetHouse.js
│  │  │  ├─ PlanFuture
│  │  │  │  └─ PlanFuture.js
│  │  │  ├─ Profile
│  │  │  │  └─ Profile.js
│  │  │  ├─ Recording
│  │  │  │  └─ Recording.js
│  │  │  ├─ Results
│  │  │  │  ├─ ResultDetail.js
│  │  │  │  └─ Results.js
│  │  │  ├─ SATScoreCalculator.js
│  │  │  ├─ StudyPlan
│  │  │  │  └─ StudyPlan.js
│  │  │  ├─ TestDetails
│  │  │  │  └─ TestDetails.js
│  │  │  ├─ Tests
│  │  │  │  ├─ TestDetail.js
│  │  │  │  ├─ Tests.js
│  │  │  │  └─ TestTaker.js
│  │  │  ├─ TestWatermark.js
│  │  │  ├─ UpgradePlan
│  │  │  │  └─ UpgradePlan.js
│  │  │  ├─ VocabQuizzes
│  │  │  │  ├─ VocabQuizTaker.js
│  │  │  │  └─ VocabQuizzes.js
│  │  │  └─ VocabSets
│  │  │     └─ VocabSets.js
│  │  ├─ services
│  │  │  ├─ api.js
│  │  │  ├─ lessonAPI.js
│  │  │  ├─ vocabQuizAPI.js
│  │  │  └─ vocabularyAPI.js
│  │  └─ utils
│  │     ├─ ipUtils.js
│  │     ├─ katexUtils.js
│  │     ├─ logger.js
│  │     ├─ productionChecks.js
│  │     └─ testCopyPaste.js
│  └─ tailwind.config.js
├─ env.example
├─ image.png
├─ package-lock.json
├─ package.json
├─ Procfile
├─ railway.json
├─ README.md
├─ server
│  ├─ DEVICE_LIMIT_README.md
│  ├─ index.js
│  ├─ middleware
│  │  ├─ auth.js
│  │  └─ checkSession.js
│  ├─ models
│  │  ├─ Article.js
│  │  ├─ Lesson.js
│  │  ├─ Question.js
│  │  ├─ Result.js
│  │  ├─ Session.js
│  │  ├─ Test.js
│  │  ├─ User.js
│  │  ├─ VocabQuiz.js
│  │  └─ Vocabulary.js
│  ├─ routes
│  │  ├─ articles.js
│  │  ├─ auth.js
│  │  ├─ lessons.js
│  │  ├─ questions.js
│  │  ├─ results.js
│  │  ├─ tests.js
│  │  ├─ upload.js
│  │  ├─ users.js
│  │  ├─ vocabQuizzes.js
│  │  └─ vocabulary.js
│  ├─ scripts
│  │  ├─ checkAdmin.js
│  │  ├─ checkArticleStructure.js
│  │  ├─ checkUserStructure.js
│  │  ├─ createAdmin.js
│  │  ├─ migrateArticles.js
│  │  ├─ removeSampleArticles.js
│  │  ├─ testAPIDeviceLimit.js
│  │  ├─ testArticleRoute.js
│  │  ├─ testAttemptLogic.js
│  │  ├─ testBuild.js
│  │  ├─ testDeviceLimit.js
│  │  ├─ testEnhancedUserManagement.js
│  │  ├─ testLoginDeviceLimit.js
│  │  ├─ testServerStart.js
│  │  ├─ testUserManagement.js
│  │  ├─ testUserManagementAPI.js
│  │  ├─ testVocabulary.js
│  │  ├─ updateArticleContentTypes.js
│  │  ├─ updateMyAccountToAdmin.js
│  │  └─ updateUserStreakFields.js
│  ├─ USER_MANAGEMENT_ENHANCEMENTS.md
│  └─ utils
│     ├─ logger.js
│     └─ streakUtils.js
└─ start.js

```