import Layout from '../components/Layout'
import PlacementPrediction from '../components/PlacementPrediction'
import { BrainCircuit, Database, Layers, TrendingUp, Zap } from 'lucide-react'

const ModelStep = ({ icon: Icon, color, title, description }) => (
    <div className="flex items-start gap-4">
        <div className={`p-3 rounded-2xl flex-shrink-0 ${color}`}>
            <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">{title}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{description}</p>
        </div>
    </div>
)

const PlacementPage = () => {
    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Page Header */}
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <BrainCircuit className="h-8 w-8 text-indigo-500" />
                        AI Placement Predictor
                    </h1>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">
                        Use our trained neural network to estimate your placement readiness based on academic metrics and skills.
                    </p>
                </div>

                {/* How the Model Works */}
                <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6 sm:p-8">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">
                        How the ML Model Works
                    </h2>
                    <div className="space-y-6">
                        <ModelStep
                            icon={Database}
                            color="bg-blue-500"
                            title="1. Training Data"
                            description="The model was trained on academic records from the institution's result dataset. Synthetic features such as internships, active backlogs, and DSA skill scores were added to enrich the dataset, resulting in a balanced mix of placed and not-placed outcomes."
                        />
                        <ModelStep
                            icon={TrendingUp}
                            color="bg-violet-500"
                            title="2. Feature Selection (mRMR)"
                            description="Minimum Redundancy Maximum Relevance (mRMR) filtering was applied to identify the most informative features. The algorithm picks inputs that are highly correlated with the placement outcome while avoiding redundancy between features."
                        />
                        <ModelStep
                            icon={Layers}
                            color="bg-indigo-500"
                            title="3. Artificial Neural Network (ANN)"
                            description="A three-layer ANN was trained: an input layer matching the selected features, two hidden layers with ReLU activation and Dropout (0.2) for regularization, and a single sigmoid output neuron. The output is a probability between 0 and 1."
                        />
                        <ModelStep
                            icon={Zap}
                            color="bg-emerald-500"
                            title="4. Prediction"
                            description="Your inputs are standardised using the same StandardScaler fit during training, then passed through the network. A probability above 0.5 is classified as 'Placed'; below 0.5 is 'Not Placed'. The exact probability score is also shown so you can track improvement over time."
                        />
                    </div>

                    {/* Input Features Table */}
                    <div className="mt-8">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4">
                            Model Input Features
                        </h3>
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-900/40">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Feature</th>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Range</th>
                                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Impact</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800/50">
                                    {[
                                        { feature: 'CGPA (GP)', range: '0 – 10', impact: 'High — strong correlation with placement outcome' },
                                        { feature: 'DSA Skill Score', range: '0 – 10', impact: 'High — key differentiator for technical roles' },
                                        { feature: 'Internships', range: '0+', impact: 'Medium — positive signal for industry readiness' },
                                        { feature: 'Active Backlogs', range: '0+', impact: 'Critical — strong negative correlation with placement' },
                                        { feature: '10th Marks (%)', range: '0 – 100', impact: 'Moderate — contributes to overall academic profile' },
                                        { feature: '12th Marks (%)', range: '0 – 100', impact: 'Moderate — contributes to overall academic profile' },
                                    ].map(({ feature, range, impact }) => (
                                        <tr key={feature} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{feature}</td>
                                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{range}</td>
                                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{impact}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Prediction Form */}
                <PlacementPrediction />
            </div>
        </Layout>
    )
}

export default PlacementPage
