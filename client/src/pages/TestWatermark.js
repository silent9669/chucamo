import React from "react";
import useCopyWatermark from "../hooks/useCopyWatermark";

export default function TestWatermark() {
  useCopyWatermark();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Copy Watermark Test Page</h1>
          
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-900 mb-3">How to Test:</h2>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>Highlight any text on this page</li>
                <li>Press Ctrl+C or right-click and select "Copy"</li>
                <li>Paste the content anywhere (like a text editor)</li>
                <li>You should see "ChuCaMo ©" added to the copied text</li>
              </ol>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-green-900 mb-3">Sample Reading Passage:</h2>
              <p className="text-green-800 leading-relaxed">
                This is a sample reading passage that simulates the content students would encounter 
                in an SAT test. You can highlight any portion of this text to test the copy protection. 
                When you copy the highlighted text, it will automatically include our watermark 
                "ChuCaMo ©" to protect our intellectual property while still allowing students 
                to use highlighting tools for test preparation.
              </p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-purple-900 mb-3">Sample Question:</h2>
              <p className="text-purple-800 mb-3">
                Based on the passage above, which of the following best describes the main purpose 
                of the copy protection system?
              </p>
              <div className="space-y-2">
                <p className="text-purple-700">A) To prevent all copying of content</p>
                <p className="text-purple-700">B) To allow highlighting while protecting content</p>
                <p className="text-purple-700">C) To make the test more difficult</p>
                <p className="text-purple-700">D) To track student behavior</p>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-yellow-900 mb-3">Important Notes:</h2>
              <ul className="list-disc list-inside space-y-1 text-yellow-800">
                <li>Highlighting still works normally for test tools</li>
                <li>Copy-paste adds "ChuCaMo ©" watermark automatically</li>
                <li>This protects our content while maintaining functionality</li>
                <li>Students can still use all test features as intended</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
