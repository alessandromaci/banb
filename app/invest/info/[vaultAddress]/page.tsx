"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, Copy, Check } from "lucide-react";
import { getVaultData } from "@/lib/vault-data";

/**
 * Investment vault information page displaying detailed vault data.
 * Shows product description, metrics, strategy allocation, and risk disclosures.
 *
 * @returns {JSX.Element} Investment info page component
 */
export default function InvestmentInfoPage() {
  const params = useParams();
  const router = useRouter();
  const vaultAddress = params.vaultAddress as string;

  const [vaultInfo, setVaultInfo] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVaultInfo = async () => {
      try {
        const vault = getVaultData(vaultAddress);
        setVaultInfo(vault);
      } catch (error) {
        console.error("Failed to fetch vault info:", error);
      } finally {
        setLoading(false);
      }
    };

    if (vaultAddress) {
      fetchVaultInfo();
    }
  }, [vaultAddress]);

  const copyAddress = async () => {
    if (vaultAddress) {
      try {
        await navigator.clipboard.writeText(vaultAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        // Silently fail
      }
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(0)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading vault information...</p>
        </div>
      </div>
    );
  }

  if (!vaultInfo) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Vault Not Found</h1>
          <p className="text-gray-400 mb-6">
            The requested vault could not be found.
          </p>
          <Button
            onClick={() => router.back()}
            className="bg-white text-black hover:bg-gray-200"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="text-white hover:bg-gray-800 p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{vaultInfo.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={copyAddress}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <span className="font-mono text-sm">
                  {vaultAddress.slice(0, 6)}...{vaultAddress.slice(-4)}
                </span>
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              <a
                href={`https://app.morpho.org/base/vault/${vaultAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <Card className="bg-gray-900 border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Product Description</h2>
          <p className="text-gray-300 leading-relaxed">
            {vaultInfo.description}
          </p>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-white">
          <Card className="bg-gray-900 border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-1 text-white">
              Total Deposits
            </h3>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(vaultInfo.totalDeposits)}
            </p>
          </Card>
          <Card className="bg-gray-900 border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-1 text-white">Liquidity</h3>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(vaultInfo.liquidity)}
            </p>
          </Card>
          <Card className="bg-gray-900 border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-1 text-white">APY</h3>
            <p className="text-2xl font-bold text-white">{vaultInfo.apy}%</p>
          </Card>
        </div>

        {/* Strategy Table */}
        <Card className="bg-gray-900 border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">Strategy</h2>
          <div className="overflow-x-auto text-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold">
                    Market Exposure
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">
                    Vault Allocation %
                  </th>
                  <th className="text-left py-3 px-4 font-semibold">
                    Vault Allocation $
                  </th>
                </tr>
              </thead>
              <tbody>
                {vaultInfo.strategy.map(
                  (
                    item: {
                      market: string;
                      exposure: string;
                      allocation: string;
                    },
                    index: number
                  ) => (
                    <tr key={index} className="border-b border-gray-800">
                      <td className="py-3 px-4">{item.market}</td>
                      <td className="py-3 px-4 text-gray-300">
                        {item.exposure}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {item.allocation}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Risk Disclosures */}
        <Card className="bg-gray-900 border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-white">
            Risk Disclosures
          </h2>
          <div className="space-y-4 text-white">
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-300">Curator TVL</span>
              <span className="font-mono">{vaultInfo.risks.curatorTVL}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-300">Owner</span>
              <span className="font-mono">{vaultInfo.risks.owner}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-white">Timelock / Guardian</span>
              <span className="font-mono">{vaultInfo.risks.timelock}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-300">Vault Deployment Date</span>
              <span className="font-mono">
                {vaultInfo.risks.deploymentDate}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-300">Curator</span>
              <span className="font-mono">{vaultInfo.risks.curator}</span>
            </div>
            <div className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-300">Market Risk Disclosures</span>
                <span className="text-gray-500">ⓘ</span>
              </div>
              <p className="text-gray-400 text-sm">
                {vaultInfo.risks.disclosure}
              </p>
            </div>
          </div>
        </Card>

        {/* Risk Curation */}
        <Card className="bg-gray-900 border-gray-700 p-6 text-white">
          <h2 className="text-xl font-semibold mb-6">Risk Curation</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-800">
              <span className="text-gray-300">Allocator Address</span>
              <span className="font-mono">{vaultInfo.risks.owner}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
